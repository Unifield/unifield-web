# -*- coding: utf-8 -*-
try:
    import openerp.addons.web.common.http as openerpweb
except ImportError:
    import web.common.http as openerpweb
import urlparse

print("-"*72)

class Share_v60(openerpweb.Controller):
    _cp_path = '/web/share_v60'

    def get_share_root_url(self, req):
        return urlparse.urlunsplit((
                    req.httprequest.scheme,
                    req.httprequest.host,
                    '/web/webclient/login',
                    'db=%(dbname)s&login=%(login)s&key=%(password)s',
                    ''))

    def get_share_wizard(self, req, action_id=None, domain=None):
        context = req.session.eval_context(req.context)
        sharecontext = context.copy()
        sharecontext['share_root_url'] = self.get_share_root_url(req)
        share_id = req.session.model('share.wizard').create({'action_id': action_id, 'domain': str(domain)}, sharecontext)
        return {'result': share_id, 'context': context}

    @openerpweb.jsonrequest
    def wizard(self, req, domain=None, action_id=None):
        return self.get_share_wizard(req, action_id=action_id, domain=domain)

    @openerpweb.jsonrequest
    def has_share(self, req):
        model_obj = req.session.model('ir.model')
        share_wizard_obj = req.session.model('share.wizard')

        share_model_ids = model_obj.search([('model','=','share.wizard')])
        if req.session.api() == '6.0' and share_model_ids \
                and share_wizard_obj.has_share():
            return True
        return False
