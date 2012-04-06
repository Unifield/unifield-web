{
    "name": "web Share v6.0",
    "category" : "Hidden",
    "description":'web Share module for v6.0 (standalone mode)',
    "version": "2.0",
    "depends": ['web'],
    'js': ['static/src/js/share_v60.js'],
    'css': ['static/src/css/share_v60.css'],
    'qweb' : [
        "static/src/xml/*.xml",
    ],
    "auto_install": True
}
