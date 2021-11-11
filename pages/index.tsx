import React, { useState, useEffect, useCallback } from "react";
import { ColorPicker, useColor, toColor } from "react-color-palette";
import {
  Page,
  Layout,
  Card,
  TextField,
  PageActions,
  SettingToggle,
  TextStyle,
  ChoiceList,
  Button,
  CalloutCard,
  Banner
} from "@shopify/polaris";
import { useAxios } from "../hooks/useAxios";
import "react-color-palette/lib/css/styles.css";

const SettingsPage = () => {
  const [axios] = useAxios();
  const [heading, setHeading] = useState("Open");
  const [primaryColor, setPrimaryColor] = useColor("hex", "#000000");
  const [secondaryColor, setSecondaryColor] = useColor("hex", "#000000");
  const [installSetting, setInstallSetting] = useState('true');

  // For mailing settings
  const [emailsActive, setEmailsActive] = useState(false);

  const handleToggle = useCallback(
    () => setEmailsActive((active) => !active),
    []
  );

  const contentStatus = emailsActive ? "Deactivate" : "Activate";
  const textStatus = emailsActive ? "on" : "off";

  const [emailDelay, setEmailDelay] = useState(["7"]);

  const handleChange = useCallback((value) => setEmailDelay(value), []);

  // END mailing settings

  const setMetafields = async () => {
    console.log("set metafields");
    let data = {
      heading,
      primaryColor: primaryColor.hex,
      secondaryColor: secondaryColor.hex,
      installSetting
    };

    await axios
      .post("/metafields", data)
      .then((res) => {})
      .catch((e) => {
        console.log(e);
      });
  };
  async function getSettings() {
    console.log("get settings from metafields");
    await axios
      .get("/metafields")
      .then((res) => {
        const { heading, primaryColor, secondaryColor, installSetting } = JSON.parse(
          res.data.metafields[0].value
        );
        setHeading(heading);
        setPrimaryColor(toColor("hex", primaryColor));
        setSecondaryColor(toColor("hex", secondaryColor));
        if(installSetting){
          setInstallSetting(installSetting);
        }
        
      })
      .catch((err) => {
        console.log(err);
      });
  }

  useEffect(()=>{
    setMetafields();
  },[installSetting])

  const [syncing, setSyncing] = useState(false);
  async function syncAllDrafts() {
    setSyncing(true);
    await axios
      .post("/drafts/sync")
      .then((res) => {
        setSyncing(false);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  useEffect(() => {
    getSettings();
  },[]);
  return (
    <Page>
      <Layout>
        <Layout.Section>
          {installSetting == 'true' ?
          <Banner title="Visit the installation instructions tab" status="warning" onDismiss={() => {setInstallSetting('false')}}>
                <p>Make sure the app is properly installed with a couple simple steps.  </p>
                <p>Need help? Email <a href="mailto:support@conspireagency.com">support@conspireagency.com</a></p>
          </Banner>
          : null }
          <Card title="Data Sync" sectioned>
            <Card.Section>
              <div style={{ display: "grid", gridTemplateColumns: "75% 25%" }}>
                <p>
                  Sync all historical draft orders. <br />
                  NOTE this is usually only necessary to sync orders prior to
                  app install.
                </p>
                <div style={{ justifyContent: "flex-end", display: "flex" }}>
                  <Button
                    onClick={syncAllDrafts}
                    disabled={syncing}
                    loading={syncing}
                    primary
                  >
                    Sync
                  </Button>
                </div>
              </div>
            </Card.Section>
          </Card>
          <Card title="Email Settings" sectioned>
            <Card.Section>
              <SettingToggle
                action={{
                  content: contentStatus,
                  onAction: handleToggle,
                }}
                enabled={emailsActive}
              >
                Email reminders are{" "}
                <TextStyle variation="strong">{textStatus}</TextStyle>.
              </SettingToggle>
            </Card.Section>
            <Card.Section>
              <ChoiceList
                title="Send an email reminder after"
                choices={[
                  { label: "7 Days", value: "7" },
                  { label: "14 Days", value: "14" },
                  { label: "30 Days", value: "30" },
                ]}
                selected={emailDelay}
                onChange={handleChange}
              />
            </Card.Section>
          </Card>
          <Card title="Account Page Settings" sectioned>
            <Card.Section>
              <TextField
                label="Label for draft orders"
                value={heading}
                onChange={setHeading}
              />
            </Card.Section>
            <Card.Section>
              <p>Set the color used for the invoices table body</p>
              <ColorPicker
                width={250}
                height={100}
                color={primaryColor}
                onChange={setPrimaryColor}
                hideHSV
                hideRGB
              />
            </Card.Section>
            <Card.Section>
              <p>Set the color used for the invoices table headings</p>
              <ColorPicker
                width={250}
                height={100}
                color={secondaryColor}
                onChange={setSecondaryColor}
                hideHSV
                hideRGB
              />
            </Card.Section>
          </Card>
        </Layout.Section>
      </Layout>
      <PageActions
        primaryAction={[
          {
            content: "Save",
            onAction: () => setMetafields(),
          },
        ]}
      />
    </Page>
  );
};

export default SettingsPage;
