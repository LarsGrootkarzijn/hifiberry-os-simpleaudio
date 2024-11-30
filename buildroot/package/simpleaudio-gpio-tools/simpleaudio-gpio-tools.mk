define SIMPLEAUDIO_GPIO_TOOLS_INSTALL_TARGET_CMDS
	$(INSTALL) -D -m 0755 $(BR2_EXTERNAL_HIFIBERRY_PATH)/package/simpleaudio-gpio-tools/initgpio \
        	   $(TARGET_DIR)/usr/bin/initgpio
    	$(INSTALL) -D -m 0755 $(BR2_EXTERNAL_HIFIBERRY_PATH)/package/simpleaudio-gpio-tools/setgpio \
        	   $(TARGET_DIR)/usr/bin/setgpio
    	$(INSTALL) -D -m 0755 $(BR2_EXTERNAL_HIFIBERRY_PATH)/package/simpleaudio-gpio-tools/getgpio \
           	$(TARGET_DIR)/usr/bin/getgpio
	$(INSTALL) -D -m 0644 $(BR2_EXTERNAL_HIFIBERRY_PATH)/package/simpleaudio-gpio-tools/sa-gpio-init.service \
                   $(TARGET_DIR)/usr/lib/systemd/system/sa-gpio-init.service
        # Create the symlink in /etc/systemd/system/multi-user.target.wants/
        rm $(TARGET_DIR)/etc/systemd/system/multi-user.target.wants/sa-gpio-init.service
	ln -s /usr/lib/systemd/system/sa-gpio-init.service \
              $(TARGET_DIR)/etc/systemd/system/multi-user.target.wants/sa-gpio-init.service
endef

$(eval $(generic-package))

