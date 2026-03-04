import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

// Inicializamos el cliente para conectar con la base de datos
const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const tableName = process.env.TABLE_NAME; // Esta variable la definiremos en Terraform

export const handler = async (event) => {
  let body;
  let statusCode = 200;
  
  // Agregamos encabezados CORS para que tu React pueda comunicarse con la API
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  try {
    // Identificamos qué quiere hacer el usuario (Leer o Guardar)
    switch (event.routeKey) {
      
      // CASO 1: Leer todas las tareas (GET)
      case "GET /tareas":
        const data = await dynamo.send(new ScanCommand({ TableName: tableName }));
        body = data.Items;
        break;

      // CASO 2: Guardar una nueva tarea (POST)
      case "POST /tareas":
        const requestJSON = JSON.parse(event.body);
        const newItem = {
          id: Date.now().toString(), // Generamos un ID único basado en el tiempo
          info: requestJSON.info      // El texto de la tarea que envías desde React
        };
        await dynamo.send(new PutCommand({
          TableName: tableName,
          Item: newItem
        }));
        body = newItem;
        break;

      default:
        throw new Error(`Ruta no soportada: ${event.routeKey}`);
    }
  } catch (err) {
    statusCode = 400;
    body = err.message;
  }

  return {
    statusCode,
    body: JSON.stringify(body),
    headers
  };
};