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
  
  

  
  config.vm.provision "shell" do |shell1| 
    shell1.path = './provision.shell.sh'
  end
  
  config.vm.provision "ansible" do |ansible1| 
    ansible1.playbook = 'playbook.yml'
  end
  
  config.vm.provision "docker" do |docker1| 
    docker1.pull_images = 'ubuntu'
  end
  
  config.vm.provision "docker" do |docker2| 
    docker2.pull_images 'ubuntu'
    docker2.pull_images 'ubuntu'
    docker2.run 'rabbitmq'
    docker2.run "ubuntu", cmd: "bash -l", args: "-v '/vagrant:/var/www'"
    docker2.run "db-1", image: "user/mysql"
    docker2.images: ["ubuntu", "gentoo"]
  end
  
  config.vm.provision "file" do |file1| 
    file1.source = './Vagrantfile'
    file1.destination = '~/OutputVagrantfile'
  end
  
end
