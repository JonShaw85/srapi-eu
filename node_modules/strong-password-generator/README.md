# strong-password-generator
Strong Password Generator is a utility module which provides straight-forward, powerful password generation function.


## Installation

To install strong-password-generator, use [npm](http://github.com/npm/npm):

```
npm install strong-password-generator
```

## Usage

### using default configurations
```javascript
var strongPaswordGenerator = require("strong-password-generator");

strongPaswordGenerator.generatePassword();
// >> "cWst77snJtVris"
```
### providing own configurations
```javascript
var strongPaswordGenerator = require("strong-password-generator");
var defaultPasswordConfig = {
  base: 'WORD',
  length: {
    min: 12,
    max: 16
  },
  capsLetters: {
    min: 3,
    max: 3
  },
  numerals: {
    min: 2,
    max: 2
  },
  spacialCharactors: {
    includes: [],
    min: 0,
    max: 0
  },
  spaces: {
    allow: false,
    min: 0,
    max: 0
  }
};

strongPaswordGenerator.generatePassword(defaultPasswordConfig); // defaultPasswordConfig optional
// >> "cWst77snJtVris"
```
### get default configurations
```javascript
var strongPaswordGenerator = require("strong-password-generator");

strongPaswordGenerator.getDefaultConfig();
// >> {
  base: 'WORD',
  length: {
    min: 12,
    max: 16
  },
  capsLetters: {
    min: 3,
    max: 3
  },
  numerals: {
    min: 2,
    max: 2
  },
  spacialCharactors: {
    includes: [],
    min: 0,
    max: 0
  },
  spaces: {
    allow: false,
    min: 0,
    max: 0
  }
}
```

## API

`strong-password-generator.`

- `generatePassword(options)` - options [OPTIONAL]
  - `base` - describe the way that password text populated [REQUIRED]
    - `WORD` - from random word for given length
    - `RANDOM` - from a totaly random text for given length
  - `length` - length of the password [REQUIRED]
    - `min` - minimum length of the password
    - `max` - maximum length of the password
  - `capsLetters` - number of capital letters needs to be included within the password [REQUIRED]
    - `min` - minimum number of captital letters for the password
    - `max` - maximum number of captital letters for the password
  - `numerals` - number of numerals needs to be included within the password [REQUIRED]
    - `min` - minimum number of numerals for the password
    - `max` - maximum number of numerals for the password
  - `spacialCharactors` - details of the speacial charactors needs to be included within the password [REQUIRED]
    - `includes` - list of special charactors used to generate password
    - `min` - minimum number of special charactors for the password
    - `max` - maximum number of special charactors for the password
  - `spaces` - details of the spaces needs to be included within the password [REQUIRED]
    - `allow` - specify whether password includes spaces or not
    - `min` - minimum number of spaces for the password
    - `max` - maximum number of spaces for the password

- `getDefaultConfig()` - to get default configurations
