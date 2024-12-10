const express = require('express');
const path = require('path');
const AdmZip = require('adm-zip');
const fs = require('fs');
var cors = require('cors');

const app = express();
app.use(cors());
const port = 3100;

async function extractThumbnailInfo(rdashPath) {
    // Check if the RDASH file exists
    if (!fs.existsSync(rdashPath)) {
        throw new Error(`File not found: ${rdashPath}`);
    }

    const zip = new AdmZip(rdashPath);

    // List all entries in the ZIP
    const entries = zip.getEntries();
    console.log('Files in RDASH:', entries.map(entry => entry.entryName)); // Log all files for debugging

    // Look for dashboard.json (case-insensitive and allow nested folders)
    const dashboardEntry = entries.find(entry => entry.entryName.toLowerCase().endsWith('dashboard.json'));
    if (!dashboardEntry) {
        throw new Error('dashboard.json not found in the .RDASH file');
    }

    // Parse the JSON content
    let dashboardJSON;
    try {
        dashboardJSON = JSON.parse(dashboardEntry.getData().toString('utf8'));
    } catch (err) {
        throw new Error('Failed to parse dashboard.json: Invalid JSON format');
    }

    // Validate the JSON structure
    const title = dashboardJSON.Title || dashboardJSON.model?.Title || 'Unknown Dashboard';
    const widgets = dashboardJSON.Widgets || dashboardJSON.model?.Widgets || [];
    const dataSources = dashboardJSON.DataSources || dashboardJSON.model?.DataSources || [];

    return {
        id: dashboardJSON.Tags || dashboardJSON.model?.Tags || 'unknown',
        displayName: title,
        info: {
            Title: title,
            ThemeName: dashboardJSON.ThemeName || dashboardJSON.model?.ThemeName || 'DefaultTheme',
            FormatVersion: dashboardJSON.FormatVersion || dashboardJSON.model?.FormatVersion || 0,
            UseAutoLayout: dashboardJSON.UseAutoLayout || dashboardJSON.model?.UseAutoLayout || false,
            Widgets: widgets.map(widget => ({
                _type: widget.VisualizationSettings?._type || 'Unknown',
                RowSpan: widget.RowSpan || 1,
                ColumnSpan: widget.ColumnSpan || 1,
                IsTitleVisible: false,
                Title: widget.Title || 'Untitled',
                VisualizationSettings: widget.VisualizationSettings || {}
            })),
            DataSources: dataSources.map(dataSource => ({
                _type: dataSource._type,
                Provider: dataSource.Provider || 'Unknown',
                Properties: {},
                Settings: {}
            })),
            GlobalFilters: [],
            GlobalVariables: [],
            IsTemplate: dashboardJSON.IsTemplate || dashboardJSON.model?.IsTemplate || false
        }
    };
}

app.get("/dashboards/", (req, res) => {

	fs.readdir("dashboards", (err, files) => {
		if (err) {
		  console.log('Error getting directory information');
		  res.status(500).send('Error getting directory information');
		} else {
		  const filenames = files.map((file) => {
			const extension = path.parse(file).ext;
			return file.slice(0, -extension.length);
		  });
		  res.send(filenames);
		}
	  });
});

app.get('/dashboards/:name/thumbnail', async (req, res) => {
    const { name } = req.params;
    //const { name } = "marketing";
    const rdashPath = path.join(__dirname, 'dashboards', `${name}.rdash`);

    //const rdashPath = "C:\\Dev-Reveal\\Apps\\Thumbnails\\dashboards\\marketing.rdash";


    try {
        const thumbnailInfo = await extractThumbnailInfo(rdashPath);
        res.json(thumbnailInfo);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Failed to process the dashboard', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
