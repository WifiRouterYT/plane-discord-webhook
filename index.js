const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
require('dotenv').config();

// move these to env
const WEB_PORT = process.env.WEB_PORT;
const APP_URL = process.env.APP_URL;
const PAYLOAD_URL = process.env.PAYLOAD_URL;
const WORKSPACE_NAME = process.env.WORKSPACE_NAME;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

const images = {
    "plane-logo": `${APP_URL}/plane-icon.png`,
    "backlog": `${APP_URL}/backlog.png`,
    "unstarted": `${APP_URL}/todo.png`,
    "started": `${APP_URL}/in-progress.png`,
    "completed": `${APP_URL}/completed.png`,
    "cancelled": `${APP_URL}/cancelled.png`
};

const priorities = {
    "urgent": ":red_circle: Urgent!",
    "high": ":orange_circle: High",
    "medium": ":yellow_circle: Medium",
    "low": ":blue_circle: Low",
    "none": ":black_circle: None"
}

// webhook settings
const IMAGE_URL = images["plane-logo"];
const DISPLAY_NAME = "Plane";

// webhook setup
const hook = new Webhook(WEBHOOK_URL);
hook.setUsername(DISPLAY_NAME);
hook.setAvatar(IMAGE_URL);

// middleware
const app = express();
app.use(express.static('img'))

/* app.delete(PAYLOAD_URL, bodyParser.raw({ type: 'application/json' }), (req, res) => {
    // verify signature
    const expectedSignature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(req.body, 'utf8').digest('hex');
    if(!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(req.headers['x-plane-signature']))) {
        console.log("[WARN] Invalid signature provided for DELETE request.");
        return res.status(403).json({error: "Invalid signature provided. Stop trying to spoof."});
    }

    console.log("[INFO] Incoming DELETE request!");
    const body = JSON.parse(req.body);
    console.log(body);

    res.status(200).send("OK");
});

app.patch(PAYLOAD_URL, bodyParser.raw({ type: 'application/json' }), (req, res) => {
    // verify signature
    const expectedSignature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(req.body, 'utf8').digest('hex');
    if(!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(req.headers['x-plane-signature']))) {
        console.log("[WARN] Invalid signature provided for PATCH request.");
        return res.status(403).json({error: "Invalid signature provided. Stop trying to spoof."});
    }
    console.log("[INFO] Incoming PATCH request!");
    const body = JSON.parse(req.body);
    console.log(body);

    res.status(200).send("OK");
}); */

const lastupdated = {};

app.post(PAYLOAD_URL, bodyParser.raw({ type: 'application/json' }), (req, res) => {
    // verify signature
    const expectedSignature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(req.body, 'utf8').digest('hex');
    if(!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(req.headers['x-plane-signature']))) {
        console.log("[WARN] Invalid signature provided for POST request.");
        return res.status(403).json({error: "Invalid signature provided. Stop trying to spoof."});
    }

    console.log("[INFO] Incoming POST request!");
    const body = JSON.parse(req.body);
    console.log(body);

    if(body["event"] === "issue_comment") {
        if(body["action"] === "created") {
            const embed = new MessageBuilder()
                .setColor(8184715)
                //.setTitle(body["data"]["name"])
                //.setDescription(body["data"]["description_stripped"])
                .setAuthor(`New comment on an item in ${WORKSPACE_NAME}!`, `${APP_URL}/plane-icon.png`)
                .setFooter(body["activity"]["actor"]["display_name"], body["activity"]["actor"]["avatar_url"])
                .addField('Comment', body["data"]["comment_stripped"], false)
                .addField('Issue ID', body["data"]["issue"], false)
            hook.send(embed)
        } else if(body["action"] === "deleted") {
            const embed = new MessageBuilder()
                .setColor("#fa7970")
                //.setTitle(body["data"]["name"])
                //.setDescription(body["data"]["description_stripped"])
                .setAuthor(`Comment deleted in ${WORKSPACE_NAME}`, `${APP_URL}/plane-icon.png`)
                .setFooter(body["activity"]["actor"]["display_name"], body["activity"]["actor"]["avatar_url"])
                .addField('Comment ID', body["data"]["id"], false)
            hook.send(embed)
        } else if(body["action"] === "updated") {
            const embed = new MessageBuilder()
                .setColor("#3e75fe")
                //.setTitle(body["data"]["name"])
                //.setDescription(body["data"]["description_stripped"])
                .setAuthor(`Comment edited in ${WORKSPACE_NAME}`, `${APP_URL}/plane-icon.png`)
                .setFooter(body["activity"]["actor"]["display_name"], body["activity"]["actor"]["avatar_url"])
                .addField('New text', body["data"]["comment_stripped"], false)
                .addField('Issue ID', body["data"]["issue"], false)
            hook.send(embed)
        }
    }
    
    if(body["event"] === "issue") {
        if(body["action"] === "created") {
            console.log("[INFO] New work item created with priority " + body["data"]["priority"] + ", sending notification!");
            const embed = new MessageBuilder()
                .setColor(8184715)
                .setTitle(body["data"]["name"])
                .setDescription(body["data"]["description_stripped"])
                .setAuthor(`New work item in ${WORKSPACE_NAME}!`, `${APP_URL}/plane-icon.png`)
                .setFooter(body["data"]["state"]["name"], images[body["data"]["state"]["group"]])
                .addField('Labels', body["data"]["labels"].length ? body["data"]["labels"].map(label => label.name).join(", ") : "None", true)
                .addField('Assignees', body["data"]["assignees"].length ? body["data"]["assignees"].map(assignee => assignee.display_name).join(", ") : "None", true)
                .addField('Priority', priorities[body["data"]["priority"]], true);
            hook.send(embed);
        } else if(body["action"] === "deleted") {
            console.log("[INFO] Work item deleted with ID " + body["data"]["id"] + ", sending notification!");
            const embed = new MessageBuilder()
                .setColor("#fa7970")
                .setTitle("")
                .setDescription("ID: `" + body["data"]["id"] + "`")
                .setAuthor(`Work item deleted in ${WORKSPACE_NAME}.`, `${APP_URL}/plane-icon.png`)
                .setFooter(body["activity"]["actor"]["display_name"], body["activity"]["actor"]["avatar_url"])
            hook.send(embed);
        } else if(body["action"] === "updated") {
            console.log("[INFO] Work item updated with ID " + body["data"]["id"] + ", sending notification!");
            const embed = new MessageBuilder()
                .setColor("#3e75fe")
                .setTitle(body["data"]["name"])
                .setAuthor(`Work item updated in ${WORKSPACE_NAME}!`, `${APP_URL}/plane-icon.png`)
                .setFooter(body["activity"]["actor"]["display_name"], body["activity"]["actor"]["avatar_url"])
            
            let fieldcounter = 0;

            // ignore these, not important enough to send
            if(body["activity"]["field"] === "state_id") return;
            if(body["activity"]["field"] === "sort_order") return;

            if(body["activity"]["field"] === "description") {
                embed.addField("Description", body["data"]["description_stripped"]);
                fieldcounter++;
            }
            if(body["activity"]["field"] === "state") {
                embed.addField("State", `${body["activity"]["old_value"]}  »  ${body["activity"]["new_value"]}`, true);
                embed.addField("Actor", body["activity"]["actor"]["display_name"], true);
                embed.setFooter(body["data"]["state"]["name"], images[body["data"]["state"]["group"]])
                fieldcounter++;
            }
            if(body["activity"]["field"] === "priority") {
                embed.addField("Priority", `${body["activity"]["old_value"]}  »  ${body["activity"]["new_value"]}`);
                fieldcounter++;
            }
            if(body["activity"]["field"] === "name") {
                embed.addField("Title", `Old: \`${body["activity"]["old_value"]}\`\nNew: \`${body["activity"]["new_value"]}\``);
                fieldcounter++;
            }
            /*if(body["activity"]["field"] === "labels") {
                if(body["activity"]["new_value"] === null) {
                    embed.addField("Labels", `Removed: \`${body["activity"]["old_value"]}\``);
                } else {
                    embed.addField("Labels", `Old: \`${body["activity"]["old_value"]}\`\nNew: \`${body["activity"]["new_value"]}\``);
                }
                fieldcounter++;
            }
            if(body["activity"]["field"] === "assignees") {
                if(body["activity"]["new_value"] === null) {
                    embed.addField("Assignees", `Removed: \`${body["activity"]["old_value"]}\``);
                } else {
                    embed.addField("Assignees", `Old: \`${body["activity"]["old_value"]}\`\nNew: \`${body["activity"]["new_value"]}\``);
                }
                fieldcounter++;
            }*/
            
            if(fieldcounter === 0) {
                let oldvalue;
                try {oldvalue = JSON.stringify(body["activity"]["old_value"]);} catch {oldvalue = "null";}
                let newvalue;
                try {newvalue = JSON.stringify(body["activity"]["new_value"]);} catch {newavlue = "null";}
                embed.setDescription("ID: `" + body["data"]["id"] + "`\n\nField `" + body["activity"]["field"] + "` changed from `" + oldvalue + "` to `" + newvalue + "`");
            } else {
                embed.setDescription("ID: `" + body["data"]["id"] + "`\n\n__Changes:__");
            }

            // stop spamming my webhook :(
            if(Math.floor(Date.now() / 1000) < lastupdated[body["data"]["id"]] + 2 && fieldcounter === 0) {
                return;
            } else {
                if(fieldcounter === 0) lastupdated[body["data"]["id"]] = Math.floor(Date.now() / 1000);
            }

            hook.send(embed);
        }
    }

    res.status(200).send("OK");
});

app.get(PAYLOAD_URL, (req, res) => {
    res.set('Content-Type', 'text/plain')
    res.status(405).send("Method not allowed!");
});

app.listen(WEB_PORT, () => {
    console.log(`[INFO] Listening on port ${WEB_PORT}!`)
});