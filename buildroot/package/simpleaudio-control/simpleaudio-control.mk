define SIMPLEAUDIO_CONTROL_INSTALL_TARGET_CMDS
	mkdir -p $(TARGET_DIR)/opt/beocreate/beo-extensions/sa-control
    	cp -rv $(BR2_EXTERNAL_HIFIBERRY_PATH)/package/simpleaudio-control/sa-control/* \
        	$(TARGET_DIR)/opt/beocreate/beo-extensions/sa-control/
	$(INSTALL) -D -m 0755 $(BR2_EXTERNAL_HIFIBERRY_PATH)/package/simpleaudio-control/sa-headphone-poll \
                $(TARGET_DIR)/usr/bin/sa-headphone-poll
endef

define SIMPLEAUDIO_CONTROL_INSTALL_INIT_SYSTEMD
        $(INSTALL) -D -m 0644 $(BR2_EXTERNAL_HIFIBERRY_PATH)/package/simpleaudio-control/sa-headphone-poll.service \
                $(TARGET_DIR)/lib/systemd/system/sa-headphone-poll.service
endef

$(eval $(generic-package))

