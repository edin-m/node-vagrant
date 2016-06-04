<% _.forEach(settings, function(value, name) { %>
    <% if (_.isArray(value)) { %>
        <% if (value.length > 0) { %>
            <%= provisionerAlias %>.<%= name %>: ['<%= value.join("', '") %>']
        <% } %>
    <% } else { %>
        <%= provisionerAlias %>.<%= name %> <%= value %>
    <% } %>
<% }); %>
