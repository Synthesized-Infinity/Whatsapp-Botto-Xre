<div align="center">
<img src="https://i.ibb.co/F3sc7Nb/Purple-Music-Store-Etsy-Banner.png" alt="Whatsapp-Botto-Xre" border="0">

# **WhatsApp-Botto-xRe**
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FSomnathDas%2FWhatsapp-Botto-Xre.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FSomnathDas%2FWhatsapp-Botto-Xre?ref=badge_shield)

## [WhatsApp Group](https://chat.whatsapp.com/JykPXBsyo6Z0TqEJcABZ2b)

> A WhatsApp Bot Built on Top of [Baileys](https://github.com/adiwajshing/baileys) <br>
> Work in progress. More features and commands will be added soon
</div><br/>
<br/>

## ✨ Highlights
- 💖 Object Oriented 
- 💙 Written in [TypeScript](https://www.typescriptlang.org/)
- 💛 Event-Based 
- 💚 [Express](https://expressjs.com/) Contorl Panel
- 💜 Self-Resoting Auth
- 💝 Built with [Baileys](https://github.com/adiwajshing/baileys) (The Best WhatsApp Library Out There) 

## ⬇ Installation 

> Make sure you have the following softwares installed
- [Git](https://git-scm.com/)
- [Node.JS](https://nodejs.org/en/)
- [WebP](https://developers.google.com/speed/webp/download)
- [FFMpeg](https://ffmpeg.org/download.html)
- [ImageMagick](https://imagemagick.org/index.php) (Make sure to enable the `legacy functions` while installing)

Clone the repo and install the npm packages after installing these
```SH
> git clone https://github.com/SomnathDas/Whatsapp-Botto-Xre
> cd Whatsapp-Botto-Xre
> npm i && npm i -D
```

## ✍ Configaration
> Edit the `config.json` according to your needs
```JSON
{
    "name": "Xre",
    "prefix": "!",
    "admins": []
}
```
`name` The name of the Bot <br>
`prefix` The Prefix of the Bot <br>
`admins` The [JIDs](https://adiwajshing.github.io/Baileys/interfaces/wauser.html#jid) of the users who you want to the Admins/Mods for the bot

Now, follow the instructions [here](https://docs.mongodb.com/manual/installation/) to install MongoDB and run a Local DB in your system or Create a Cloud Database using [Mongo Atlas](https://www.mongodb.com/cloud/atlas/register) 

> Create a file named `.env` 

In the created `.env` and make sure to add every fields wrriten below
```txt
MONGO_URI=YOUR_MONGODB_CONNECTION_URI
```
`MONGO_URI` is the [connection URI](https://docs.mongodb.com/manual/reference/connection-string/) for the Database (If you're using Mongo Atlas, Use the Connection URI got from there. Else use the URL in [`.env.example`](https://github.com/SomnathDas/Whatsapp-Botto-Xre/blob/a06de9dc143a8a887475bd77d4d059e3193c2875/.env.example#L1))

## ⌨ Building

Run `npm run build` and the Compiled JS files, Decleration Files, Maps and Declaration Maps with their folder will appear in the `dist` folder

## 💻 Running

```SH
npm start
```
Running the above command will start the bot. 
To authenticate scan the QR which shows up in the terminal or the link which is logged when the QR event fires using the WA-Web Scanner on your WhatsApp.
Now you're on your own. Good Luck!

## 💪 Contribution

+ Feel free to open issues regarding any problems or if you have any feature requests
+ Make sure to follow the ESLint Rules while editing the code and run `npm run prettier-format` before opening PRs





## 📑 License

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FSomnathDas%2FWhatsapp-Botto-Xre.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FSomnathDas%2FWhatsapp-Botto-Xre?ref=badge_large)
