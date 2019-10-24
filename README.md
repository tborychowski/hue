# hue

![Screen](screen.png)

## Set-Up

### Config
1. Copy `config-sample.json` to `config.json`
2. Replace the parameters (see below)


### Hue Bridge
1. Go to: `https://<hue bridge IP>/debug/clip.html`
2. Enter:
   - URL: `/api`
   - body: `{"devicetype":"my_hue_app#my_user"}`
3. Before sending - press the button on the hue bridge
4. Click `POST`
5. Copy username (e.g. `1028d66426293e821ecfd9ef1a0731df`) to the config file



### OpenWeatherMap
1. Go to https://home.openweathermap.org/api_keys
2. Register (free), create new key and add it to the config.


### Automate
1. Add cronjob to run e.g. every hour:
    ```sh
	    0 * * * * /path/to/script/index.js -c
	```

### Done!
Open `http://localhost/hue/index.html` in browser (requires a server)





## Links
- [Hue - Getting started](https://www.developers.meethue.com/documentation/getting-started)
- [Hue - Sensors API](https://developers.meethue.com/develop/hue-api/5-sensors-api) (requires hue dev account)
