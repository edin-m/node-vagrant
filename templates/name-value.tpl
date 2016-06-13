<% _.forEach(rootConfig.config, function(value, name) { %>
  <%= rootConfig.name %>.<%= name %> = <%= value %>
<% }); %>
