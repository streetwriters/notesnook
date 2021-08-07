export const sleep = (duration) =>
new Promise((resolve) => setTimeout(() => {
    console.log('Sleeping for ' + (duration/1000) + " secs");
    resolve();
}, duration));

//"\\.e2e\\.js$",