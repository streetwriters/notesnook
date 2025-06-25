# Contributing guidelines

Please read the [contributing guidelines](../../CONTRIBUTING.md) beforehand.

### Setting web clipper locally 

#### Running the web clipper

1. Install packages and setup the repo. Run this command in the repository root:
    ```sh
    npm install
    ```
1. Run the Notesnook webapp:
    ```sh
    npm run start:web
    ```
1. Navigate to the web clipper folder: 
    ```sh
    cd extensions/web-clipper
    ```
1. Run the web clipper:
    ```sh
    npm run dev:chrome
    ```

#### Viewing the web clipper

1. Open chrome and go to `chrome://extensions`.
1. Turn on "Developer Mode".
1. Click on "Load unpacked" and select the `extensions/web-clipper/build` folder.
