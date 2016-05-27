# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
Vagrant.configure(2) do |config|
  # The most common configuration options are documented and commented below.
  # For a complete reference, please see the online documentation at
  # https://docs.vagrantup.com.

  <% _.forEach(config.vm, function(value, key) { %>
  config.vm.<%=key%> = "<%=value%>"
  <% }); %>

  <% if(typeof config.network !== 'undefined') { %>
  config.vm.network "<%= config.network.type %>"<% _.forEach(config.network.detail, function(value, key) { %>, <%= key %>: <% if(typeof value === 'string') { %>"<%=value%>"<% } else { %><%=value%><% } %><% }); %>
  <% } %>

  <% if(typeof config.providers !== 'undefined') { %>
  <% _.forEach(config.providers, function( settings,provider) { %>
  config.vm.provider "<%= provider %>" do |<%= provider %>|
    <% _.forEach(settings, function(value, name) { %>
    <%= provider %>.<%= name %> = <%= value %>
  <% }); %>
  end
  <% }); %>
  <% }; %>


  <% if(typeof config.provisioners !== 'undefined') { %>
  <% _.forEach(config.provisioners, function( settings,provisioner) { %>
  config.vm.provision "<%= provisioner %>" do |<%= provisioner %>|
    <% _.forEach(settings, function(value, name) { %>
    <%= provisioner %>.<%= name %> = <%= value %>
    <% }); %>
  end
  <% }); %>
  <% }; %>

end
