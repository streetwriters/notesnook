import SettingsService from '../services/SettingsService';

const {LayoutAnimation} = require('react-native');

function withAnimation(duration = 300) {
  // try {
  //   throw new Error('error withAnimation')
  // } catch(e) {
  //   console.log(e.stack);
  // }
  console.log('reduce withAnimation: ',SettingsService.get().reduceAnimations)
  if (SettingsService.get().reduceAnimations) return;
  LayoutAnimation.configureNext(
    LayoutAnimation.create(duration, 'linear', 'opacity')
  );
}

function withSpringAnimation(duration = 300) {
  // try {
  //   throw new Error('error withSpringAnimation')
  // } catch(e) {
  //   console.log(e.stack);
  // }
  
  console.log('reduce withSpringAnimation: ',SettingsService.get().reduceAnimations)
  if (SettingsService.get().reduceAnimations) return;
  LayoutAnimation.configureNext({
    duration: duration,
    create: {
      type: LayoutAnimation.Types.linear,
      property: LayoutAnimation.Properties.opacity,
      duration: duration / 2
    },
    update: {
      type: LayoutAnimation.Types.spring,
      springDamping: 0.8
    },
    delete: {
      type: LayoutAnimation.Types.easeOut,
      property: LayoutAnimation.Properties.opacity,
      duration: duration / 2
    }
  });
}

export default {
  withAnimation,
  withSpringAnimation
};
