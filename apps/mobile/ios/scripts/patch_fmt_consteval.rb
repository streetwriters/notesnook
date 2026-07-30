# Xcode >= 26.2 rejects fmt's compile-time format-string check with
#
#   call to consteval function 'fmt::fstring<...>::fstring<char[N]>' is not a
#   constant expression
#
# React Native 0.81/0.82 vendor fmt 11.0.2, which hits this. It is an upstream
# incompatibility (reproducible in a stock RN app), but left alone it makes those
# RN versions permanently un-buildable on a modern Xcode.
#
# fmt's own escape hatch is FMT_USE_CONSTEVAL: 0 downgrades the format-string
# check from compile-time to run-time. fmt 11.0.2 does not guard its detection
# block with #ifndef, so we cannot simply predefine the macro -- and doing it
# through the build settings is worse anyway:
#
#   * a command-line GCC_PREPROCESSOR_DEFINITIONS outranks every per-target
#     value, silently dropping COCOAPODS=1, RCT_METRO_PORT, ...
#   * a second `post_install` block in the Podfile REPLACES React Native's own.
#
# So we patch the header itself, right after fmt has made up its mind and before
# the first use of the macro. Idempotent, and safe to run on every pod install.

module PatchFmtConsteval
  MARKER = 'NOTESNOOK_FMT_CONSTEVAL_PATCH'.freeze

  # The line that first consumes the macro; our override goes immediately above
  # it, i.e. after the whole detection cascade.
  ANCHOR = "#if FMT_USE_CONSTEVAL\n".freeze

  OVERRIDE = <<~PATCH.freeze
    // #{MARKER}: Xcode >= 26.2 rejects fmt's consteval format-string check
    // (see ios/scripts/patch_fmt_consteval.rb). Applied automatically by
    // `pod install`; downgrades the check to run-time.
    #undef FMT_USE_CONSTEVAL
    #define FMT_USE_CONSTEVAL 0
  PATCH

  # pods_root: the Pods directory (installer.sandbox.root).
  def self.apply!(pods_root)
    header = File.join(pods_root.to_s, 'fmt', 'include', 'fmt', 'base.h')

    unless File.exist?(header)
      Pod::UI.warn "fmt: #{header} not found, skipping consteval patch."
      return
    end

    contents = File.read(header)

    if contents.include?(MARKER)
      Pod::UI.puts 'fmt: consteval patch already applied.'
      return
    end

    index = contents.index(ANCHOR)
    if index.nil?
      Pod::UI.warn 'fmt: could not find `#if FMT_USE_CONSTEVAL` in base.h; ' \
                   'the consteval patch was NOT applied. If this fmt version ' \
                   'still uses a consteval format-string check, builds on ' \
                   'Xcode >= 26.2 will fail -- update ' \
                   'ios/scripts/patch_fmt_consteval.rb.'
      return
    end

    contents.insert(index, OVERRIDE)

    # CocoaPods checks pod sources out read-only (0444), so make the header
    # writable for the write and restore the original mode afterwards.
    mode = File.stat(header).mode & 0o7777
    begin
      File.chmod(mode | 0o200, header)
      File.write(header, contents)
    ensure
      File.chmod(mode, header)
    end

    Pod::UI.puts 'fmt: patched base.h to set FMT_USE_CONSTEVAL=0 (Xcode >= 26.2 compatibility).'
  end
end
