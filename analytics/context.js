const Analytics = require('./index');

module.exports = (context) => {
  context.onMount(() => {
    const analytics = new Analytics('kde');
    const initialState = context.data();
    analytics.onLoad(() => {
      analytics.updateState(initialState);
      context.onUpdate((newState) => {
        analytics.updateState(newState);
      });
    })
  })
}