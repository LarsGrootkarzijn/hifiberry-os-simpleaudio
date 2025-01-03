define SIMPLEAUDIO_UPDATER_INSTALL_TARGET_CMDS
	mkdir -p $(TARGET_DIR)/opt/beocreate/beo-extensions/sa-update
    	cp -rv $(BR2_EXTERNAL_HIFIBERRY_PATH)/package/simpleaudio-updater/sa-update/* \
        	$(TARGET_DIR)/opt/beocreate/beo-extensions/sa-update/

        $(INSTALL) -D -m 0444 $(BR2_EXTERNAL_HIFIBERRY_PATH)/package/simpleaudio-updater/services \
                $(TARGET_DIR)/opt/hifiberry/etc/services
	$(INSTALL) -D -m 0444 $(BR2_EXTERNAL_HIFIBERRY_PATH)/package/simpleaudio-updater/config-files \
                $(TARGET_DIR)/opt/hifiberry/etc/config-files

	$(INSTALL) -D -m 0755 $(BR2_EXTERNAL_HIFIBERRY_PATH)/package/simpleaudio-updater/sa-updater \
        	   $(TARGET_DIR)/usr/bin/sa-updater
endef

$(eval $(generic-package))

