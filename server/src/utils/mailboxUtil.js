const stringUtils = require('./stringUtils');
const {compact} = require('./collectionUtils');
const {Strings} = require('../constants.data');
const _ = require('lodash');
let mailboxUtil = null;
const SFGClient = require('../clients/SFGClient.class');
const sfg = new SFGClient();

class MailboxUtil {
  /**
   * Get the path to the customer mailbox
   * @param {TaskData} task_data - task data
   * @return {string} - returns path
   */

  // TODO:  REFACTOR , get rid of this use fromTemplate
  getCustomerMailbox(task_data) {

    // Just take the first one
    if (task_data.customRoutes && task_data.customRoutes.length > 0) {
      const template = task_data.customRoutes[0].templateName;
      if (template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_CONNECTDIRECT_INBOUND) ||
        template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_CONNECTDIRECT_OUTBOUND)) {
        const splits = compact(stringUtils.trimLeft(task_data.customRoutes[0].subdirs, '/').split('/'));
        const root = stringUtils.ensureStartsWithSlash(splits[0]);
        //if (_.isEmpty(root)) throw new Error(`Connect Direct must have at least one subdir ${JSON.stringify(task_data.customRoutes)}`);
        return root;
      }
      else if (template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_MAE_INTERNAL) ||
        template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_MDE_INTERNAL)) {
        return `/mftinternal/${task_data.user_id}`;
      }
      else return `/mftexternal/${task_data.user_id}`;
    }
    else return `/mftexternal/${task_data.user_id}`;

  }

  async getCommonTemplateForUser(userId) {
    const res = await sfg.getRouteChannelsForUser(userId);
    let templateName = '';
    let customRoutes = [];
    console.log(JSON.stringify(res, null, 4));
    if (res.length > 0) {
      templateName = res[0].templateName;
      const succeeded = res.filter(doc => !doc.errorCode).every(doc => doc.templateName === templateName);
      if (succeeded) {
        let consumer = 'customer', producer = 'acxiom', direction = Strings.DIRECTION.OUTBOUND;

        if (templateName.includes(Strings.CUSTOM_ROUTES.TEMPLATES.INBOUND) ||
          templateName.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_CONNECTDIRECT_INBOUND) ||
          templateName.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_MDE_INBOUND) ||
          templateName.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_MAE_INBOUND)
        ) {
          consumer = 'acxiom';
          producer = 'customer';
          direction = Strings.DIRECTION.INBOUND;
        }
        customRoutes = _.uniqWith(res.map(item => ({
          consumer,
          producer,
          templateName,
          direction,
          provisioningFacts: item.provisioningFacts ? item.provisioningFacts : [],
          subdirs: item.provisioningFacts ? item.provisioningFacts.reduce((prev, current) => prev.provFactValue + '/' + current.provFactValue) : '',
          nonrouting_subdirs: ''
        })), _.isEqual);

        return {succeeded, templateName, customRoutes};
      }
      else return {
        succeeded,
        errorDescription: 'The user ' + userId + ' has more than one type of route channel and cant be updated automatically , please request for manual intervention',
        templateName: '',
        customRoutes
      };
    }
    else return {
      succeeded: false,
      errorDescription: 'No routes found for user ' + userId,
      templateName: '',
      customRoutes
    };
  }

  /**
   *  Get acxiom mailbox path from direction
   * @param {String} direction - direction
   * @param {String} user_id - userid
   * @param {String} internal_mailbox_name - i forget
   * @return {string} - returns path
   */
  // TODO:  REFACTOR , get rid of this use fromTemplate
  getAxciomMailbox(direction, user_id, internal_mailbox_name) {
    if (direction === Strings.DIRECTION.INBOUND) {
      return `/mftinternal/inbound/esftpi/${user_id}`;
    }
    else if (direction === Strings.DIRECTION.OUTBOUND) {
      return `/mftinternal/outbound/esftpo/${user_id}`;
    }
    else if (direction === Strings.DIRECTION.INTERNAL) {
      let ret = '/mftinternal/internal/iftp/' + user_id;
      if (internal_mailbox_name) ret += '/' + stringUtils.trimLeft(internal_mailbox_name, '/');
      return ret;
    }
  }

  /**
   * Gets customer mailbox from template
   * @param {String} template - template
   * @param {String} producer - producer
   * @param {String} consumer - consumer
   * @param {String} subdirs - the subdirs
   * @return {string} - returns path
   */
  getCustomerMailboxFromTemplate(template, producer, consumer, subdirs = '') {
    if (template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_MDE_INBOUND) ||
      template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_MAE_INBOUND)) {
      return `/mftexternal/${producer}/${consumer}/Outbound` + subdirs;
    }
    else if (template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_MAE_INTERNAL)) {
      return `/mftinternal/${consumer}/Inbound` + subdirs;
    }
    else if (template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_MAE_OUTBOUND)) {
      return `/mftexternal/${consumer}/Inbound` + subdirs;
    }
    else if (template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_MDE_OUTBOUND)) {
      return `/mftexternal/${consumer}/${producer}/Inbound` + subdirs;
    }
    else if (template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_MDE_INTERNAL)) {
      return `/mftinternal/${producer}/${consumer}/Outbound` + subdirs;
    }
    else if (template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_CONNECTDIRECT_OUTBOUND) ||
      template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_CONNECTDIRECT_INBOUND)) {
      return `/${subdirs}`;
    }
    else if (template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.INBOUND)) {
      return this.getCustomerMailbox({
        needs_internal_account: false,
        user_id: producer,
        customRoutes: [{templateName: template, producer, consumer, subdirs}]
      });
    }
    else if (template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.OUTBOUND)) {
      return this.getCustomerMailbox({
        needs_internal_account: false,
        user_id: consumer,
        customRoutes: [{templateName: template, producer, consumer, subdirs}]
      }) + subdirs;
    }
    else {
      throw new Error(`Cant determine customer mailbox from template=${template}`);
    }
  }

  /**
   * Gets mailbox path from template
   * @param {String} template - template
   * @param {String} producer - producer
   * @param {String} consumer - consumer
   * @param {String} subdirs - subdirs
   * @return {string} returns acxiom mailbox
   */
  getAcxiomMailboxFromTemplate(template, producer, consumer, subdirs = '') {
    let ret = '';
    if (template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_MDE_INBOUND)) {
      ret = `/mftinternal/${consumer}/${producer}/Inbound` + subdirs;
    }
    else if (template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_MAE_OUTBOUND) ||
      template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_MDE_OUTBOUND) ||
      template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_MAE_INTERNAL) ||
      template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_MDE_INTERNAL)) {
      ret = `/mftinternal/${producer}/${consumer}/Outbound` + subdirs;
    }
    else if (template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_MAE_INBOUND)) {
      ret = `/mftinternal/${consumer}/Inbound` + subdirs;
    }
    else if (template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_CONNECTDIRECT_OUTBOUND) ||
      template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_CONNECTDIRECT_INBOUND)) {
      ret = `/mftinternal/${subdirs}`;
    }
    else if (template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.INBOUND)) {
      ret = `/mftinternal/inbound/esftpi/${producer}/${subdirs}`;
    }
    else if (template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.OUTBOUND)) {
      ret = `/mftinternal/outbound/esftpo/${consumer}/${subdirs}`;
    }
    else if (template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_FTS_IFTP)) {
      ret = `/mftinternal/internal/iftp/${consumer}`;
    }
    else throw new Error(`Could not determine Acxiom Mailbox Path from template = "${template}`);
    return stringUtils.trimRight(ret, '/');
  }


  /**
   * Returns the corrected mailbox path, adds all of the subdirectories to the mailboxPaths array
   * @private
   * @param {string} base - base mailbox path
   * @param {string} subdirs - the full path of subdirs
   * @param {Set} destination - the mailboxPaths array to add to
   * @return {string} - returns the corrected mailbox path
   */
  addSubdirectoryPermissions(base, subdirs, destination) {
    let temp = base;
    const trimmedSplits = _.compact(subdirs.split('/'));

    if (temp === '/') temp = '';

    if (!_.isEmpty(temp)) destination.add(temp + ' Mailbox');
    trimmedSplits.forEach(s => {
      if (s && s.length > 0) {
        temp += '/' + s;
        destination.add(temp + ' Mailbox');
      }
    });

  }

  getACLPermissionsFromTemplate(template, consumer, producer, subdirs, nonrouting_subdirs, nonrouting_subdir_side) {
    const full_path = this.getAcxiomMailboxFromTemplate(template, consumer, producer);
    return this._getPermissionsFromTemplate(template, consumer, producer, subdirs, nonrouting_subdirs, (nonrouting_subdir_side === Strings.ACXIOM || nonrouting_subdir_side === Strings.BOTH), full_path);
  }

  getUserPermissionsFromTemplate(template, consumer, producer, subdirs, nonrouting_subdirs, nonrouting_subdir_side) {
    const full_path = this.getCustomerMailboxFromTemplate(template, consumer, producer);
    return this._getPermissionsFromTemplate(template, consumer, producer, subdirs, nonrouting_subdirs, (nonrouting_subdir_side === Strings.CUSTOMER || nonrouting_subdir_side === Strings.BOTH), full_path);
  }

  _getPermissionsFromTemplate(template, consumer, producer, subdirs, nonrouting_subdirs, should_add_non_routing, full_path) {
    // A little different here than the standard getUserPermissions
    const userPermissions = new Set();
    if (template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_MDE_INBOUND) ||
      template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_MDE_OUTBOUND) ||
      template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_MAE_INBOUND) ||
      template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_MAE_INTERNAL) ||
      template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_MDE_INTERNAL) ||
      template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_MAE_OUTBOUND)) {

      const base = full_path.split('/').slice(0, 3).join('/');
      const dirs = '/' + full_path.split('/').slice(3).join('/');

      this.addSubdirectoryPermissions(base, dirs + subdirs, userPermissions);

      if (nonrouting_subdirs && should_add_non_routing) {
        this.addSubdirectoryPermissions(base, dirs + nonrouting_subdirs, userPermissions);
      }
    }
    else if (
      template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_CONNECTDIRECT_OUTBOUND) ||
      template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.ACXIOM_CONNECTDIRECT_INBOUND)) {
      if (full_path.includes('mftinternal')) {
        this.addSubdirectoryPermissions(full_path, subdirs, userPermissions);
      }
      else this.addSubdirectoryPermissions('', subdirs, userPermissions);
    }
    else if (template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.INBOUND) ||
      template.includes(Strings.CUSTOM_ROUTES.TEMPLATES.OUTBOUND)) {
      this.addSubdirectoryPermissions(full_path, subdirs, userPermissions);

      if (nonrouting_subdirs && should_add_non_routing) {
        this.addSubdirectoryPermissions(full_path, nonrouting_subdirs, userPermissions);
      }
    }

    else throw new Error(`Unable to determine userPermissions for template = "${template}`);
    return Array.from(userPermissions);

  }

}

if (!mailboxUtil) {
  mailboxUtil = new MailboxUtil();
}
module.exports = mailboxUtil;
