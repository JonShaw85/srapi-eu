const config = require("../../config")

const EloPercentageIncrease = {
    1: {
        high: 35,
        low: 50
    },
    13: {
        high: 30,
        low: 45
    },
    310: {
        high: 25,
        low: 40
    },
    1020: {
        high: 20,
        low: 30
    },
    2050: {
        high: 10,
        low: 20
    },
    5080: {
        high: 0,
        low: 10
    },
    80100: {
        high: -20,
        low: 0
    },
}

const XPPercentageIncrease = {
    1: {
        percent: 50
    },
    13: {
        percent: 40
    },
    310: {
        percent: 30
    },
    1020: {
        percent: 20
    },
    2050: {
        percent: 15
    },
    5080: {
        percent: 10
    },
    80100: {
        percent: 5
    },
}

const srdIncrease = {
    1: {
        amount: 50000
    },
    13: {
        amount: 30000
    },
    310: {
        amount: 20000
    },
    1020: {
        amount: 10000
    },
    2050: {
        amount: 5000
    },
    5080: {
        amount: 2500
    },
    80100: {
        amount: 1250
    },
}

const utils = {
    calculateEloReward: function (userElo, finishPos) {
        var calculatePercentageIncrease = function (finishingPos) {
            var percentInc = 0
            var isHighElo = userElo >= 1750

            if (isHighElo) { //We are in the high elo bracket, so give less rewards
                if (finishingPos <= 1) {
                    [percentInc = EloPercentageIncrease[1].high]
                } else if (finishingPos <= 3) {
                    [percentInc = EloPercentageIncrease[13].high]
                } else if (finishingPos <= 10) {
                    [percentInc = EloPercentageIncrease[310].high]
                } else if (finishingPos <= 20) {
                    [percentInc = EloPercentageIncrease[1020].high]
                } else if (finishingPos <= 50) {
                    [percentInc = EloPercentageIncrease[2050].high]
                } else if (finishingPos <= 80) {
                    [percentInc = EloPercentageIncrease[5080].high]
                } else {
                    [percentInc = EloPercentageIncrease[80100].high]
                }
            } else {
                if (finishingPos <= 1) {
                    [percentInc = EloPercentageIncrease[1].low]
                } else if (finishingPos <= 3) {
                    [percentInc = EloPercentageIncrease[13].low]
                } else if (finishingPos <= 10) {
                    [percentInc = EloPercentageIncrease[310].low]
                } else if (finishingPos <= 20) {
                    [percentInc = EloPercentageIncrease[1020].low]
                } else if (finishingPos <= 50) {
                    [percentInc = EloPercentageIncrease[2050].low]
                } else if (finishingPos <= 80) {
                    [percentInc = EloPercentageIncrease[5080].low]
                } else {
                    [percentInc = EloPercentageIncrease[80100].low]
                }
            }

            return percentInc
        }

        var calculateThresholdDifference = function (elo) {
            var difference = 0
            if (elo < 300) {
                difference = 100
            } else if (elo < 850) {
                difference = 150
            } else if (elo < 1750) {
                difference = 300
            } else if (elo < 3250) {
                difference = 500
            } else if (elo < 5250) {
                difference = 750
            } else if (elo < 8000) {
                difference = 2750
            } else {
                difference = 4000
            }

            return difference
        }

        var percentInc = calculatePercentageIncrease(finishPos)
        var threshholdAmount = calculateThresholdDifference(userElo)
        var isNegativePerc = percentInc < 0

        var finalIncValue = (percentInc / 100) * threshholdAmount

        if (isNegativePerc) {
            finalIncValue *= -1
        }

        return finalIncValue
    },
    calculateXpReward: function (finishPos) {
        var calcPercentInc = (finPos) => {
            let percentInc = 0

            if (finPos <= 1) {
                [percentInc = XPPercentageIncrease[1].percent]
            } else if (finPos <= 3) {
                [percentInc = XPPercentageIncrease[13].percent]
            } else if (finPos <= 10) {
                [percentInc = XPPercentageIncrease[310].percent]
            } else if (finPos <= 20) {
                [percentInc = XPPercentageIncrease[1020].percent]
            } else if (finPos <= 50) {
                [percentInc = XPPercentageIncrease[2050].percent]
            } else if (finPos <= 80) {
                [percentInc = XPPercentageIncrease[5080].percent]
            } else {
                [percentInc = XPPercentageIncrease[80100].percent]
            }

            return percentInc
        }

        let percent = calcPercentInc(finishPos)
        let xp = config.xpPerUnlock
        let finalIncValue = (percent / 100) * xp

        return finalIncValue
    },
    calculateSrdReward: function (finishPos) {
        var calcSrdAmount = (finPos) => {
            let srdAmount = 0;

            if (finPos <= 1) {
                [srdAmount = srdIncrease[1].amount]
            } else if (finPos <= 3) {
                [srdAmount = srdIncrease[13].amount]
            } else if (finPos <= 10) {
                [srdAmount = srdIncrease[310].amount]
            } else if (finPos <= 20) {
                [srdAmount = srdIncrease[1020].amount]
            } else if (finPos <= 50) {
                [srdAmount = srdIncrease[2050].amount]
            } else if (finPos <= 80) {
                [srdAmount = srdIncrease[5080].amount]
            } else {
                [srdAmount = srdIncrease[80100].amount]
            }

            return srdAmount;
        }

        let srd = calcSrdAmount(finishPos);
        return srd;
    }
}

module.exports = utils