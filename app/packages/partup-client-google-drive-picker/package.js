Package.describe({
    name: 'partup-client-google-drive-picker',
    version: '0.0.1',
    summary: '',
    documentation: null
});

Package.onUse(function(api) {

    api.use([
        'ecmascript',
        'templating'
    ], 'client');


    api.addFiles([

        'google-api.min.js',
        'GoogleDrivePicker.html',
        'GoogleDrivePicker.ctrl.js'

    ], 'client');

});
