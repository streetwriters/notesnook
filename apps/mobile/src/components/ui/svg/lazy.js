import React from 'react';

export const QRCode = React.lazy(async () => {
  const module = await (await import('./module-svg')).default;
  return {
    default: module.QRCode
  };
});

export const SvgXml = React.lazy(async () => {
  const module = await (await import('./module-svg')).default;
  return {
    default: module.SvgXml
  };
});

export const ProgressBarComponent = React.lazy(async () => {
  const module = await (await import('./module-svg')).default;
  return {
    default: module.Progress.Bar
  };
});

export const ProgressCircleComponent = React.lazy(async () => {
  const module = await (await import('./module-svg')).default;
  return {
    default: module.Progress.Circle
  };
});
