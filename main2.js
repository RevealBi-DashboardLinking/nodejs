var express = require('express');
var reveal = require('reveal-sdk-node');
var cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

// Step 0 - Create API to Retrieve Dashboards
app.get('/dashboards', (req, res) => {
  const directoryPath = './dashboards';
  fs.readdir(directoryPath, (err, files) => {
    const fileNames = files.map((file) => {
    const { name } = path.parse(file);
    return { name };
    });
    res.send(fileNames);
  });
});

// Step 1 - Optional, userContext
const userContextProvider = (request) => {
  const userId = request.headers['x-header-one']; 
  console.log("in userContextProvider " + userId);  
  var props = new Map();
  props.set("userId", userId); 
  return new reveal.RVUserContext(userId, props);
};

// Step 2 - Set up your Authentication Provider
const authenticationProvider = async (userContext, dataSource) => {
  console.log("Enter Authentication Provider"); 
    if (dataSource instanceof reveal.RVSqlServerDataSource) {
      return new reveal.RVUsernamePasswordDataSourceCredential("dev", "mugger(lunges0"); }
  }

// Step 3 - Set up your Data Source Provider
const dataSourceProvider = async (userContext, dataSource) => {
    if (dataSource instanceof reveal.RVSqlServerDataSource) {
      dataSource.host = "s0106linuxsql1.infragistics.local";
      dataSource.database = "devtest";
  }
  return dataSource;
}

// Step 4 - Set up your Data Source Item Provider
const dataSourceItemProvider = async (userContext, dataSourceItem) => {
  console.log("Enter dataSourceItemProvider");
  
  // SQL Server
  if (dataSourceItem instanceof reveal.RVSqlServerDataSourceItem) {
        await dataSourceProvider(userContext, dataSourceItem.dataSource);

        if (dataSourceItem.id == "CustomerOrders")
        {
            dataSourceItem.customQuery = "Select * from Orders";    
        }
    }
 
    return dataSourceItem;
  }

// Step 5 - Set up your Reveal Options
const revealOptions = {
    userContextProvider: userContextProvider,
    authenticationProvider: authenticationProvider,
    dataSourceProvider: dataSourceProvider,
    dataSourceItemProvider: dataSourceItemProvider,
    localFileStoragePath: "data"
}

// Step 6 - Initialize Reveal with revealOptions
app.use('/', reveal(revealOptions));

// Step 7 - Start your Node Server
app.listen(7066, () => {
    console.log(`Reveal server accepting http requests`);
});
