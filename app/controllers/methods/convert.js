var Convert = {

    binaryToHex: (b) => {
      return b.match(/.{4}/g).reduce((acc, i) => {
          return acc + parseInt(i, 2).toString(16);
      }, '');
    },
  
    hexToBinary: (h) => {
      return h.split('').reduce((acc, i) => {
          return acc + ('000' + parseInt(i, 16).toString(2)).substr(-4, 4);
      }, '');
    },
  };
  
  module.exports = Convert;