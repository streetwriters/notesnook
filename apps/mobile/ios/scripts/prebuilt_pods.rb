require 'fileutils'
require 'json'

module PrebuiltPods
  RCT_FOLLY = 'RCT-Folly'
  RCT_FOLLY_VERSION = '2024.11.18.00'
  PODS_ROOT = File.expand_path('..', __dir__)
  PREBUILT_ROOT = File.join(PODS_ROOT, '.prebuilt-xcframeworks')
  CACHE_ROOT = File.join(PREBUILT_ROOT, '.cache')
  CONFIG_PATH = File.join(PODS_ROOT, 'prebuilt-libraries.json')
  BUILD_SCRIPT = File.join(PODS_ROOT, '..', 'scripts', 'build-prebuilt-ios.js')
  CONFIG_DIRS = { 'debug' => 'Debug', 'release' => 'Release' }.freeze
  SELECT_PHASE = 'Select prebuilt xcframework for the current configuration'

  def self.disabled?
    ENV['NN_USE_PREBUILT_IOS'] == '0'
  end

  def self.node_executable
    return @node_executable if defined?(@node_executable) && @node_executable

    @node_executable = begin
      Pod::Executable.execute_command('which', ['node']).strip
    rescue StandardError
      nil
    end
    @node_executable = 'node' if @node_executable.nil? || @node_executable.empty?
    @node_executable
  end

  def self.libraries
    @libraries ||= File.exist?(CONFIG_PATH) ? JSON.parse(File.read(CONFIG_PATH))['libraries'] || {} : {}
  end

  # Asks the Node build script which pods have a valid, current artifact.
  def self.available_artifacts
    return @available_artifacts if defined?(@available_artifacts)

    @available_artifacts = begin
      output = Pod::Executable.execute_command(node_executable, [BUILD_SCRIPT, '--list']).strip
      JSON.parse(output)
    rescue StandardError => e
      Pod::UI.warn "[Prebuilt iOS] could not list artifacts: #{e.message}"
      {}
    end
    @available_artifacts
  end

  # Both configurations must be present: a pod may only be swapped for a prebuilt
  # binary when the Debug and the Release slice both exist, because React Native
  # links a different React core per configuration and mixing the two crashes at
  # runtime.
  def self.reason_available(pod, artifacts)
    configs = artifacts[pod]
    if configs.nil?
      'no artifact matches the current hash'
    elsif CONFIG_DIRS.keys.any? { |config| !configs.key?(config) }
      "missing #{(CONFIG_DIRS.keys - configs.keys).join(', ')} artifact"
    end
  end

  # The artifact filename carries the hash, so a marker keyed on that name is
  # enough to skip re-extracting an unchanged zip while still re-extracting when
  # a new artifact replaces an old one.
  def self.unzip_artifact(zip, destination)
    marker = File.join(destination, ".extracted-#{File.basename(zip)}")
    return if File.exist?(marker)

    # A partial extraction would leave the previous artifacts' slices behind
    # because an archive only overwrites what it contains.
    FileUtils.rm_rf(destination)
    FileUtils.mkdir_p(destination)
    system('unzip', '-oq', zip, '-d', destination) || raise(
      "[Prebuilt iOS] failed to unzip #{zip}"
    )
    FileUtils.touch(marker)
  end

  def self.pod_dir(pod)
    File.join(CACHE_ROOT, pod)
  end

  # CocoaPods records `:path` verbatim in Podfile.lock, and the Podfile directory
  # is what it resolves those paths against. Handing it an absolute path would
  # bake this machine's checkout location into the lockfile and churn it on every
  # other machine and on CI.
  def self.relative_pod_dir(pod)
    Pathname.new(pod_dir(pod)).relative_path_from(
      Pod::Config.instance.installation_root
    ).to_s
  end

  def self.podspec_for(native_modules, npm_name)
    packages = (native_modules || {})[:ios_packages] || []
    package = packages.find { |p| p[:name] == npm_name }
    package && package[:podspec_path]
  end

  # Swaps the configuration being built into the vendored xcframework. CocoaPods
  # can only vendor one configuration, so the copy it installs into the build
  # directory would otherwise always be that one. Replacing the vendored
  # framework before it runs leaves CocoaPods to select the slice for the current
  # platform and arch, and keeps Debug and Release from mixing React core ABIs.
  # The copy is refreshed so that CocoaPods' own copy step is not skipped as up
  # to date.
  def self.select_configuration_script(pod)
    <<~SH
      set -e
      vendored_root="${PODS_ROOT}/../.prebuilt-xcframeworks/.cache/#{pod}"
      case "${CONFIGURATION}" in
        Debug) prebuilt_config="debug" ;;
        *) prebuilt_config="release" ;;
      esac
      source_dir="${vendored_root}/${prebuilt_config}/#{pod}.xcframework"
      if [ ! -d "${source_dir}" ]; then
        echo "warning: [Prebuilt iOS] no #{pod} ${prebuilt_config} artifact, keeping the vendored copy"
        exit 0
      fi
      destination="${vendored_root}/#{pod}.xcframework"
      rm -rf "${destination}"
      cp -R "${source_dir}" "${destination}"
      find "${destination}" -exec touch -h {} +
    SH
  end

  # Rewrites the resolved podspec so that the prebuilt binary replaces the pod's
  # sources, keeping dependencies and build settings intact.
  def self.prepare_prebuilt_pod(pod, podspec_path, artifacts)
    return nil unless podspec_path && File.exist?(podspec_path)

    spec = Pod::Specification.from_file(podspec_path)
    target_dir = pod_dir(pod)
    FileUtils.mkdir_p(target_dir)

    # A pod may already vendor binaries of its own (for example
    # react-native-fast-openpgp vendors OpenPGPBridge.xcframework alongside its
    # sources). Those must be preserved, but podspec file patterns have to stay
    # relative to the pod root, so bring them into the prebuilt pod directory.
    pod_root = File.dirname(podspec_path)
    inherited_frameworks = Array(spec.attributes_hash['vendored_frameworks']).map do |path|
      source = File.expand_path(path, pod_root)
      next nil unless File.exist?(source)

      name = File.basename(source)
      destination = File.join(target_dir, name)
      FileUtils.rm_rf(destination)
      FileUtils.cp_r(source, destination)
      name
    end.compact
    strip_sources(spec)

    CONFIG_DIRS.each_key do |config|
      unzip_artifact(artifacts[pod][config], File.join(target_dir, config))
    end

    # CocoaPods resolves and validates the vendored xcframework at install time,
    # so one configuration has to be in place before the first build. The script
    # phase replaces it with whichever configuration Xcode is building.
    vendored_dir = File.join(target_dir, "#{pod}.xcframework")
    FileUtils.rm_rf(vendored_dir)
    FileUtils.cp_r(File.join(target_dir, 'debug', "#{pod}.xcframework"), vendored_dir)

    spec.vendored_frameworks = inherited_frameworks + ["#{pod}.xcframework"]
    spec.attributes_hash['script_phases'] = Array(spec.attributes_hash['script_phases']) + [
      {
        'name' => SELECT_PHASE,
        'script' => select_configuration_script(pod),
        'always_out_of_date' => '1'
      }
    ]

    File.write(File.join(target_dir, "#{pod}.podspec.json"), spec.to_pretty_json)
    target_dir
  end

  def self.strip_sources(spec)
    spec.attributes_hash.delete('source_files')
    spec.attributes_hash.delete('private_header_files')
    spec.attributes_hash.delete('preserve_paths')
    spec.subspecs.each { |subspec| strip_sources(subspec) }
  end

  # Reading a podspec evaluates it, and third-party podspecs branch on the
  # New Architecture environment at evaluation time. `install_modules_dependencies`
  # also decides whether a pod depends on the source third-party pods or on the
  # prebuilt ReactNativeDependencies pod at evaluation time. React Native only sets
  # all of that inside `use_react_native!`, which runs after this file, so establish
  # the same state first or podspecs are read as if the New Architecture were off.
  # These assignments are idempotent, so the later ones from `use_react_native!`
  # are no-ops.
  def self.ensure_react_native_prebuilt_state(native_modules)
    ENV['RCT_NEW_ARCH_ENABLED'] = '1'
    ENV['RCT_FABRIC_ENABLED'] = '1'

    return unless defined?(ReactNativeDependenciesUtils) && defined?(ReactNativeCoreUtils)

    rn_path = native_modules[:react_native_path]
    return if rn_path.nil?

    relative = Pod::Config.instance.installation_root.relative_path_from(Pathname.pwd)
    version = NewArchitectureHelper.extract_react_native_version(File.join(relative, rn_path))
    ReactNativeDependenciesUtils.setup_react_native_dependencies(rn_path, version)
    ReactNativeCoreUtils.setup_rncore(rn_path, version)
  end

  def self.setup(podfile, native_modules)
    return if disabled?

    ensure_react_native_prebuilt_state(native_modules)

    artifacts = available_artifacts
    libraries.each do |npm_name, lib|
      pod = lib['pod']
      reason = reason_available(pod, artifacts)
      if reason
        Pod::UI.puts "[Prebuilt iOS] #{pod}: building from source (#{reason})".yellow
        next
      end

      path = prepare_prebuilt_pod(pod, podspec_for(native_modules, npm_name), artifacts)
      unless path
        Pod::UI.puts "[Prebuilt iOS] #{pod}: building from source (podspec not found)".yellow
        next
      end

      relative_path = relative_pod_dir(pod)
      podfile.pod(pod, :path => relative_path)
      Pod::UI.puts "[Prebuilt iOS] #{pod}: using prebuilt (debug: #{File.basename(artifacts[pod]['debug'])}, " \
                   "release: #{File.basename(artifacts[pod]['release'])})".green
    end
  end

  # Keeps third-party podspecs that hardcode `s.dependency "RCT-Folly"` resolvable
  # when React Native's prebuilt dependencies omit the source pods.
  def self.rn_dependencies_prebuilt?
    return false if disabled?
    return false unless defined?(ReactNativeDependenciesUtils)
    return false if ReactNativeDependenciesUtils.build_react_native_deps_from_source

    true
  end

  def self.write_rct_folly_shim
    root = File.join(CACHE_ROOT, RCT_FOLLY)
    FileUtils.mkdir_p(root)
    File.write(File.join(root, "#{RCT_FOLLY}.podspec.json"), JSON.pretty_generate(
      'name' => RCT_FOLLY,
      'version' => RCT_FOLLY_VERSION,
      'license' => { 'type' => 'Apache License, Version 2.0' },
      'homepage' => 'https://github.com/facebook/folly',
      'summary' => 'Shim: folly is provided by the prebuilt ReactNativeDependencies pod.',
      'authors' => 'Meta Platforms, Inc. and its affiliates',
      'platforms' => { 'ios' => '15.1' },
      'source' => { 'path' => '.' },
      'default_subspecs' => 'Default',
      'subspecs' => [
        { 'name' => 'Default', 'dependencies' => { 'ReactNativeDependencies' => [] } },
        { 'name' => 'Fabric', 'dependencies' => { 'ReactNativeDependencies' => [] } }
      ]
    ) + "\n")
    root
  end

  def self.install_react_native_dependencies_shims(podfile)
    return unless rn_dependencies_prebuilt?

    write_rct_folly_shim
    podfile.pod RCT_FOLLY, :path => relative_pod_dir(RCT_FOLLY)
    Pod::UI.puts "[Prebuilt iOS] #{RCT_FOLLY}: shim -> ReactNativeDependencies".green
  end
end
