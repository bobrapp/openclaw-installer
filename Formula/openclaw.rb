# Homebrew Formula for OpenClaw Guided Install
# AiGovOps Foundation | https://aigovopsfoundation.org
# License: Apache 2.0 + Commons Clause (non-commercial)
#
# Install:  brew tap bobrapp/openclaw && brew install openclaw
# Usage:    openclaw start
#
class Openclaw < Formula
  desc "Guided macOS/cloud installer for OpenClaw — preflight, deploy, hardening"
  homepage "https://github.com/bobrapp/openclaw-installer"
  url "https://github.com/bobrapp/openclaw-installer/archive/refs/tags/v2.2.0.tar.gz"
  # sha256 will be filled after release: sha256 "PLACEHOLDER"
  license "Apache-2.0"
  head "https://github.com/bobrapp/openclaw-installer.git", branch: "master"

  depends_on "node@20"

  def install
    system "npm", "install", "--production=false"
    system "npm", "run", "build"

    # Copy built application
    libexec.install Dir["dist/*"]
    libexec.install "bin/openclaw.mjs"
    libexec.install "scripts"
    libexec.install "package.json"
    libexec.install "node_modules"
    libexec.install Dir["public/*.html"]
    libexec.install Dir["public/*.pdf"]

    # Create wrapper script
    (bin/"openclaw").write <<~EOS
      #!/bin/bash
      exec "#{Formula["node@20"].opt_bin}/node" "#{libexec}/bin/openclaw.mjs" "$@"
    EOS
  end

  def caveats
    <<~EOS
      OpenClaw Guided Install by AiGovOps Foundation

      Start the web UI:
        openclaw start

      Run preflight checks:
        openclaw preflight

      Run E2E validation:
        openclaw validate

      Documentation:
        https://github.com/bobrapp/openclaw-installer
    EOS
  end

  test do
    assert_match "openclaw v", shell_output("#{bin}/openclaw version")
  end
end
