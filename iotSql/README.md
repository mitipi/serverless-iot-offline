## IoT SQL

In AWS IoT, rules are defined using an SQL-like syntax. SQL statements are composed of three types of clauses:
 - SELECT - Required. Extracts information from the incoming payload and performs transformations.
 - FROM - Required. The MQTT topic filter from which the rule receives messages.
 - WHERE - Optional. Adds conditional logic that determines if a rule is evaluated and its actions are executed.
           
`iotSql` folder consists of methods for parsing SQL statements, applying transformations to incoming payload and executing additional actions.  
There are methods for each step of the process.  
 - Methods for parsing SQL statement:
   - `parseSql.js` - split up SQL statement to select, from and where parts
   - `whereParser.js` - tokenize WHERE part of SQL statement
 
 - Methods for applying transformations to incoming payload using previously parsed SQL:
   - `applySqlWhere.js` - build and apply where clause condition based on payload. This condition determines whether lambda function will execute or not.
   - `applySqlSelect.js` - builds `event` for lambda function.
   - `sqlFunctions.js` - local implementation of [AWS Iot SQL functions](https://docs.aws.amazon.com/iot/latest/developerguide/iot-sql-functions.html)
   - `eval.js` - executes select statement in context of SQL functions.
   
 - Methods for executing actions:
   - `applyActions.js` - execute additional action defined on Iot rule.
