<% _.forEach(settings, function(value, name) { %>
    <%= provisionerAlias %>.<%= name %> <%= value %>
<% }); %>
