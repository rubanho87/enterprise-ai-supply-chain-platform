from contextlib import contextmanager
from typing import Any

from databricks import sql

from app.core.config import settings


@contextmanager
def get_databricks_connection():
    """
    Create and safely close a connection to the Databricks SQL Warehouse.
    """
    connection = sql.connect(
        server_hostname=settings.databricks_server_hostname,
        http_path=settings.databricks_http_path,
        access_token=settings.databricks_access_token,
    )

    try:
        yield connection
    finally:
        connection.close()


def execute_query(
    query: str,
    parameters: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """
    Execute a SQL query against Databricks and return rows
    as a list of dictionaries.
    """

    with get_databricks_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, parameters=parameters)

            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()

    return [
        dict(zip(columns, row))
        for row in rows
    ]