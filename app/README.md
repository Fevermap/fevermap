# Fevermap front-end

The front-end is a [progressive web application](https://en.wikipedia.org/wiki/Progressive_web_application). While developing it you need to have NodeJS installed to generate the files, but the end result is a fully static package of HTML, CSS and JavaScript files. PWAs use modern web technologies to create a app like experience, so there is no need to do separate Android/IOS applications, as this one PWA application will serve all platforms.

In addition to the front-end, there is also a back-end server that receives and stores the data submitted (see folder `api`). The front-end and back-end communicate via a JSON API and there is no other coupling between them.

This front-end is is written with

- Lit Element
- Webpack
- Sass

### Development

To start the development environment, run `./run-server.sh` in the app directory. This will start a ES dev server and Webpack watcher for easy development.

The software will run on http://localhost:6006/.

#### Development with Docker

If you don't want to install NodeJs et al on your own environment, you can alternatively also run the development environment in Docker. To spin up a local development environment, simply run `docker-compose up --build`. The window will keep displaying the logs from the environments.

#### Creating a Merge Request

Before creating a merge request fixing a front-end issue, please run `npm run check` and fix warnings/error accordingly.

The command will run `Prettier` and `ESLint` with the development rules set for Web Components.


#### Creating a new Component

To create a new component, create a new Java Script file in the folder `src/app/components`. You need to import components so that the `customElement` gets defined, so make sure to import the component to at least the view it's used in.


#### Styling new components

To style a component, create a sass file named after the component to `src/assets/styles/components` and import it in the file `imports.scss`.

The project uses SASS so any rules of SASS apply here.

#### Using Material Components

The project used [Material Components Web](https://material-components.github.io/material-components-web-catalog/#/) for some of the UI elements.

#### Adding translations

To add a translation in a new language, open the translation file in `src/assets/language` and add a new JSON object after the latest language object.

A easy work process is to copy the English translation object, paste it at the end of the array, and rename the `"en"` object to the wanted language.

The language selector on the page takes care of adding the choice to change to given language so all you need to do is rewrite the translation values in the file `translator.js`.


#### Contacting external API's

To keep logic separated, API calls should be done in the Service layer.

Create a service in the folder `src/app/services` and do the API calls there.

### Building

To build the project, run `npm run build`


### Writing Web Components / Lit HTML

- [Polymer Project](https://lit-element.polymer-project.org/guide) has great resources about Lit Elements.
- [Open WC](https://open-wc.org/) has great info about Web Components

## Production

1. Run `npm run build` in directory `app` so that the static files are generated in subdirectory `dist`.

2. Copy `dist` to a web server (e.g. Nginx) and let it serve.
