var hal = require('../index');

hal.get('http://api.ourapp.date/cloudFiles/47').follow(['cloudFile', 'author', 'mate', 'notes']).then(function (json) {
    console.log(JSON.stringify(json, null, 4));
}).catch(function (err) {
    console.error(err);
});