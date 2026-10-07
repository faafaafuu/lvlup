// Убирает push-entitlement (aps-environment): бесплатный Apple ID при сайдлоаде его не подпишет,
// а приложению нужны только локальные напоминания, которым APNs не нужен.
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withoutPush(config) {
  return withEntitlementsPlist(config, (cfg) => {
    delete cfg.modResults['aps-environment'];
    return cfg;
  });
};
