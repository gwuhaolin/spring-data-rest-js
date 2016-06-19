module.exports = {
    entry: {
        request: ['./request.js'],
        spring: ['./browser.js']
    },
    output: {
        path: 'dist',
        filename: '[name].js'
    }
};