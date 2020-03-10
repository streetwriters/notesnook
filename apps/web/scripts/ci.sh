#!/usr/bin/env bash
# This script is meant to be triggered on "package.json:scripts:preinstall"
# Once executed, it will allow fetching a private Github repository (the GITHUB_SSH_KEY_CDE is a RSA private key, that matches a Github "Deploy key")
# See https://spectrum.chat/zeit/now/deploy-with-private-github-dependency~67f5de5b-ad7f-4ff0-afbe-c1b717cca4db

echo "Resolving deployment's origin (Zeit, GitHub Actions, AWS CodeBuild), with HOME='$HOME'"

function configure_ssh() {
  echo "Configuring environment with a custom ssh key to be able to fetch private dependencies..."

  local SSH_HOME="$1"/.ssh
  echo "Using SSH_HOME='$SSH_HOME'"

  mkdir -p "$SSH_HOME"

  echo "${GH_DEPLOY_KEY}" >"$SSH_HOME"/id_rsa # We must use "id_rsa" file name, using a custom name will fail
  chmod 400 "$SSH_HOME"/id_rsa

  ssh-keyscan -t rsa github.com >>"$SSH_HOME"/known_hosts # Look and make trust communications between github.com and the builder
}

if [[ "$HOME" == "/zeit" ]]; then # On Zeit
  echo "Detected environment: Zeit"
  configure_ssh /root

elif [[ "$HOME" == "/home/runner" ]]; then # On Github Actions
  echo "Detected environment: Github Actions"
  configure_ssh "$HOME"

else
  echo "Detected environment: None"
  echo "This environment isn't handled (not a CI/CD env), nothing will be installed"
fi