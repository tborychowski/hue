# hue

![Screen](screen.png)

## [Getting started](https://www.developers.meethue.com/documentation/getting-started)

1. Go to: `https://<hue bridge IP>/debug/clip.html`
2. Enter:
   - URL: `/api`
   - body: `{"devicetype":"my_hue_app#my_user"}`
3. Before sending - press the button on the hue bridge
4. Click `POST`
5. Copy username (e.g. `1028d66426293e821ecfd9ef1a0731df`) to the config file
6. Create `config.json`:
    ```json
    { "ip": "<hue bridge IP>", "username": "<username>", "location": "<city, country>" }
	```
7. Add cronjob to run e.g. every hour:
    ```sh
	    0 * * * * /path/to/script/index.js -c
	```
8. Open `http://localhost/hue/index.html` in browser (requires a server)


## Links
- [Sensors API](https://developers.meethue.com/develop/hue-api/5-sensors-api) (requires hue dev account)
