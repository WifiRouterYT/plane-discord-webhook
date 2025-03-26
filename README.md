# plane-discord-webhook
middleman to convert self hosted https://plane.so/ instance webhooks into discord webhooks or something idfk

heavy WIP

how to run (assuming you know how to setup a webhook and your app is open to the internet):
* copy `.env.example` to `.env` and fill in all of the values
* clone repo and run `npm i` to install all packages
* run `node index.js` and you should be good

### What works so far
* created work items
* deleted work items
* updated work items (though a bit buggy)
* created/edited/deleted comments

### To-Do
* lookup and/or cache IDs using Plane API to provide more valuable information, as especially with deletes it provides no info other than an ID
* multiple workspace support

### Environment values / config
* `WEB_PORT`: Self explanatory, the port on which this application will listen for webhooks on
* `APP_URL`: The URL to this app (more details in .env.example file)
* `PAYLOAD_URL`: The route on which to expect the webhook to send data to, i.e. **/plane/webhook**
* `WORKSPACE_NAME`: Your workspace name
* `WEBHOOK_URL`: The Discord webhook URL to send notifications to
* `WEBHOOK_SECRET`: The plane webhook secret to verify signatures with

all icons used are property of plane.so. i am not affiliated in any way with Plane or anybody involved.