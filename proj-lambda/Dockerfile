# Usar imagem base oficial do Lambda Python 3.11
FROM public.ecr.aws/lambda/python:3.11

# Definir variável para pular compilação se possível
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Copiar requirements
COPY requirements.txt ${LAMBDA_TASK_ROOT}/

# Instalar dependências forçando wheels quando possível
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r ${LAMBDA_TASK_ROOT}/requirements.txt --prefer-binary

# Copiar código da aplicação
COPY lambda_function.py ${LAMBDA_TASK_ROOT}/

# Handler
CMD ["lambda_function.lambda_handler"]
