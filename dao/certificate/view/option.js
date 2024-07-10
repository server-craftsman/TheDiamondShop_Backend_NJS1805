const { last } = require("pdf-lib")

module.exports ={
    formate: 'A4',
    orientation: 'portrait',
    border: '8mm',
    header: {
        height: '18mm',
        contents: '<h4 style=" color: red;font-size:20;font-weight:800;text-align:center;">DIAMOND CERTIFICATE</h4>'
        },
        footer: {
            height: '18mm',
            contents: {
                first: 'Cover page',
                2: 'Second Page',
                default: '<span style= "color: #444;">{{page}}</span>/<span>{{page}}</span>',
                last: 'Last Page'
            }
        }

    }