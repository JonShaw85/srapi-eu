module.exports = {
	'version': '1.01',
	'gameVersion': '3', //old
	'gameVersion_android': '12', // -1 in the code means up to date
	'gameVersion_ios': '11', // -1 in the code means up to date
	'secret': 'iHateSuperbuff',
	'database': 'mongodb://soccerrally:SuperBuffGames1982@ds035485.mongolab.com:35485/heroku_30fk6f9m',

	"iron_source_key": "sra_dU29vA1bM022a",
	"max_fuel": 12,
	"fuel_refill_time": 3600, //In sec //28800

	"user_session_expiry": 31536000 * 5, //

	"srd_doubler_name": "coindoubler",
	"unlimited_fuel_name": "unlimitedfuel",

	"email_secret": "NunoHerlanderSimõesEspíritoSanto",

	"rewards_data": [
		{ item_name: "reward_goals", goals: 50 },
		{ item_name: "reward_wins", wins: 10 },
		{ item_name: "reward_matches", matches_last_48: 20 }
	],

	"season_pass_name": "season_pass_sra1",

	"dailyrewardcar": "Muscle",

	"lpBoostAmount": 15,
	"winStreakBonus": 10,
	"xpPerUnlock": 1500
};