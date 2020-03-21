# Fever Map Frontend

Fever Map frontend folder.

Frontend is written with 

- Lit Element
- Webpack
- Sass


### Development

To start the development environment, run `./run-server.sh` in the app directory. This will start a ES dev server and Webpack watcher for easy development.

The software will run on port 6006.


#### Creating a new Component

To create a new component, create a new javascript file to the `src/app/components` -folder. You need to import components so that the customElement gets defined, so make sure to import the component to at least the view it's used in.


#### Styling new components

To style a component, create a sass file named after the component to `src/assets/styles/components` and import it in the `imports.scss` -file.

The project uses SASS so any rules of SASS apply here.

#### Using Material Components

The project has Material Components Web imported, meaning you can use components found [here](https://material-components.github.io/material-components-web-catalog/#/)

#### Adding translations

To add a translation in a new language, open the translation file in `src/assets/language` and add a new JSON object after the latest language object.

A easy work process is to copy the english translation object, paste it at the end of the array, and rename the `"en"` object to the wanted language.

The language selector on the page takes care of adding the choice to change to given language so all you need to do is rewrite the translation values in the `translations.json` -file.


#### Contacting external API's

To keep logic seperated, API calls should be done in the Service -layer.

Create a service in the `src/app/services` -folder and do the API calls there.

### Building

To build the project, run `npm run build`


### Writing Web Components / Lit HTML

[Polymer Project](https://lit-element.polymer-project.org/guide) has great resources about Lit Elements.

[Open WC](https://open-wc.org/) has great info about Web Components