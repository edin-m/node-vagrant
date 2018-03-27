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

  
  config.vm.box = "ubuntu/trusty64"
  

  
  config.vm.network "public_network", guest: 83, host: 85
  

  
  
  config.vm.provider "virtualbox" do |virtualbox|
    
    virtualbox.memory = 384
    
  end
  
  config.vm.provider "lxc" do |lxc|
    
    lxc.container_name = 'test'
    
  end
  
  

  
  config.vm.provision "shell" do |shell| 
    shell.path = './provision.shell.sh'
  end
  
  config.vm.provision "ansible" do |ansible| 
    ansible.playbook = 'playbook.yml'
  end
  
  config.vm.provision "docker" do |docker| 
    docker.pull_images = 'ubuntu'
  end
  
  config.vm.provision "file" do |file| 
    file.source = './Vagrantfile'
    file.destination = '~/OutputVagrantfile'
  end
  
end
