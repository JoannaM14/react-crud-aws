# 1. CONFIGURACIÓN DEL PROVEEDOR
provider "aws" {
  region = "us-east-1"
}

variable "github_token" {
  description = "Token de acceso personal de GitHub"
  type        = string
  sensitive   = true
}

# 2. BASE DE DATOS (DYNAMODB)
resource "aws_dynamodb_table" "tareas_db" {
  name           = "TablaTareasJoanna"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

# 3. PREPARACIÓN DEL CÓDIGO (ZIP)
# Esto comprime tu archivo index.js automáticamente
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "../lambda/index.js"
  output_path = "lambda_function.zip"
}

# 4. PERMISOS (IAM)
# Creamos el "carnet de identidad" de la Lambda para que AWS la deje trabajar
resource "aws_iam_role" "iam_lambda" {
  name = "role_lambda_tareas"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

# Le damos permiso a la Lambda para escribir en la base de datos y crear logs
resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.iam_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

# 5. EL CEREBRO (LAMBDA)
resource "aws_lambda_function" "crud_lambda" {
  filename      = "lambda_function.zip"
  function_name = "FuncionCRUD_Tareas"
  role          = aws_iam_role.iam_lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.tareas_db.name
    }
  }
}

# 6. LA PUERTA DE ENLACE (API GATEWAY)
resource "aws_apigatewayv2_api" "api_http" {
  name          = "API-Tareas-Vite"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["content-type"]
  }
}

# Conexión entre la API y la Lambda
resource "aws_apigatewayv2_integration" "lambda_inst" {
  api_id           = aws_apigatewayv2_api.api_http.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.crud_lambda.invoke_arn
}

# Rutas de la API
resource "aws_apigatewayv2_route" "get_tareas" {
  api_id    = aws_apigatewayv2_api.api_http.id
  route_key = "GET /tareas"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_inst.id}"
}

resource "aws_apigatewayv2_route" "post_tareas" {
  api_id    = aws_apigatewayv2_api.api_http.id
  route_key = "POST /tareas"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_inst.id}"
}

# Permiso para que la API pueda "llamar" a la Lambda
resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.crud_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api_http.execution_arn}/*/*"
}

# Escenario por defecto para la API
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api_http.id
  name        = "$default"
  auto_deploy = true
}

# 7. FRONTEND (AWS AMPLIFY)
resource "aws_amplify_app" "proyecto_crud" {
  name          = "CRUD-Tareas-Joanna"
  repository    = "https://github.com/JoannaM14/react-crud-aws" 
  oauth_token   = var.github_token

  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - cd frontend
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: frontend/dist
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
  EOT
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.proyecto_crud.id
  branch_name = "main"
}

# 8. RESULTADO (OUTPUT)
# Esto te dará la URL de tu API en la terminal al terminar
output "api_url" {
  value = aws_apigatewayv2_stage.default.invoke_url
}