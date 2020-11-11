var nodemailer = require('nodemailer');
var transport = nodemailer.createTransport({
	debug: true,
    host: 'smtp.transip.email', // hostname
    secure: true,
    port: 465, // port for secure SMTP
    auth: {
        user: "kevin@superbuffgames.com",
        pass: "SuperBuffGames1982"
    }
});

module.exports = transport;