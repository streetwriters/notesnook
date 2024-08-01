
const isGithubRelease = false;
const config = {
  commands: require('@callstack/repack/commands'),
  project: {
    android: {
      sourceDir: './android'
    }
  }
};

if (!config.dependencies) config.dependencies = {};

config.dependencies['react-native-vector-icons'] = {
  platforms: {
    ios: null,
  },
}

config.dependencies['react-native-screenguard'] = {
  platforms: {
    android: null,
  },
}

if (isGithubRelease) {
  config.dependencies["react-native-iap"] = {
    platforms: {
      android:null
    }
  }
  config.dependencies["react-native-in-app-review"] = {
    platforms: {
      android: null
    }
  }
}

const repackCommands = require('@callstack/repack/commands');

config.commands = repackCommands.filter((command) =>
  command.name.startsWith('webpack')
),

module.exports = config;
