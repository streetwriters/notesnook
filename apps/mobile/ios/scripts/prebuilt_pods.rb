require 'fileutils'

module PrebuiltPods
  RCT_FOLLY = 'RCT-Folly'
  RCT_FOLLY_VERSION = '2024.11.18.00'

  def self.rn_dependencies_prebuilt?
    return false if ENV['NN_USE_PREBUILT_IOS'] == '0'
    return false unless defined?(ReactNativeDependenciesUtils)
    return false if ReactNativeDependenciesUtils.build_react_native_deps_from_source

    true
  end

  def self.stub_root
    File.join(Pod::Config.instance.installation_root.to_s, 'build', 'prebuilt-pods', RCT_FOLLY)
  end

  def self.write_rct_folly_stub
    root = stub_root
    FileUtils.mkdir_p(root)
    File.write(File.join(root, "#{RCT_FOLLY}.podspec"), <<~SPEC)
      Pod::Spec.new do |s|
        s.name = '#{RCT_FOLLY}'
        s.version = '#{RCT_FOLLY_VERSION}'
        s.license = { :type => 'Apache License, Version 2.0' }
        s.homepage = 'https://github.com/facebook/folly'
        s.summary = 'Shim: folly is provided by the prebuilt ReactNativeDependencies pod.'
        s.authors = 'Meta Platforms, Inc. and its affiliates'
        s.platforms = min_supported_versions
        s.source = { :path => '.' }
        s.default_subspec = 'Default'
        s.pod_target_xcconfig = {
          'HEADER_SEARCH_PATHS' => '"$(PODS_ROOT)/ReactNativeDependencies" "$(PODS_ROOT)/Headers/Public/ReactNativeDependencies"'
        }
        s.subspec 'Default' do |ss|
          ss.dependency 'ReactNativeDependencies'
        end
        s.subspec 'Fabric' do |ss|
          ss.dependency 'ReactNativeDependencies'
        end
      end
    SPEC
    root
  end

  def self.install_react_native_dependencies_shims(podfile)
    return false unless rn_dependencies_prebuilt?

    podfile.pod RCT_FOLLY, :path => write_rct_folly_stub
    Pod::UI.puts "[Prebuilt iOS] #{RCT_FOLLY}: shim -> ReactNativeDependencies".green
    true
  end
end
