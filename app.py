import os
import pyodbc
import pandas as pd
from flask import Flask, render_template, request,redirect, url_for,jsonify,render_template_string
from dotenv import load_dotenv

load_dotenv()
server = os.getenv("SERVIDOR")
database = os.getenv("BASE_DE_DATOS")
#user = os.getenv("USUARIO")
#pwd = os.getenv("CLAVE")

connection_string = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};TrustServerCertificate=Yes;Trusted_Connection=yes;'
#UID={user};PWD={pwd};


app = Flask(__name__)



@app.route('/', methods=['GET', 'POST'])
def index():
    try:
        query_main = """
        SELECT 
        TS.IN_COD_TERMINALSUCURSALES AS ID, 
        TS.ST_SERIAL_TERMINAL AS SERIAL,
        S.ST_DESC_SUCURSAL AS SUCURSAL,
        C.ST_DESC_CAJASUCURSAL AS CAJA, 
        TS.IN_ESTADOTERMINAL_ACTIVA AS ESTADO_TERMINAL,
        CASE WHEN TS.IN_ESTADOCAJA_INTEGRADA = 1 THEN 1 ELSE 0 END AS TERMINAL_INTEGRADO,
        TS.IN_ESTADOCAJA_INTEGRADA AS CAJA_INTEGRADA,
        TS.ST_COD_TERMINAL AS ID_TERMINAL_GETNET,
        TS.ST_COD_SUCURSALASIGNACIONTERMINAL AS ID_SUCURSAL_GETNET
        FROM homologacionpalumbo.dbo.T_GEN_SUCURSAL S    
        JOIN QA_Adyacente.DBO.T_GETNET_TERMINALSUCURSALES TS 
        ON TS.IN_COD_SUCURSAL = S.IN_COD_SUCURSAL
        AND S.ST_DESC_SUCURSAL NOT LIKE '%(CERRADO)%'
        AND CONVERT(INT, S.ST_CODIGO_SUCURSAL) > 300
        AND CONVERT(INT, S.ST_CODIGO_SUCURSAL) < 500
        JOIN homologacionpalumbo.dbo.T_POS_CAJASUCURSAL C 
        ON C.IN_COD_CAJASUCURSAL = TS.IN_COD_CAJASUCURSAL
        
        """

        query_dropdown_sucursal = """
        SELECT DISTINCT ST_DESC_SUCURSAL
        FROM homologacionpalumbo.DBO.T_GEN_SUCURSAL S
        JOIN T_GETNET_TERMINALSUCURSALES TS 
        ON TS.IN_COD_SUCURSAL = S.IN_COD_SUCURSAL
        WHERE ST_DESC_SUCURSAL NOT LIKE '%(CERRADO)%'
        AND CONVERT(INT, ST_CODIGO_SUCURSAL) > 300
        AND CONVERT(INT, ST_CODIGO_SUCURSAL) < 500
        """

        query_dropdown_caja = """
        SELECT DISTINCT C.ST_DESC_CAJASUCURSAL 
        FROM homologacionpalumbo.DBO.T_GEN_SUCURSAL S
        JOIN homologacionpalumbo.DBO.T_POS_CAJASUCURSAL C
        ON C.IN_COD_SUCURSAL = S.IN_COD_SUCURSAL
        """

        if request.method == 'POST':
            sucursal_input = request.form.get('miInput')
            caja_input = request.form.get('miInputCaja')
            terminal_input = request.form.get('busqueda_sucursal_terminal')
            terminal_id_input = request.form.get('busqueda_id_terminal')
            terminal_serial_input = request.form.get('busqueda_serial_terminal')
            CAJA_INTEGRADA = request.form.get('miInputIntegrada')
            terminal_integrada = request.form.get('miInputTerminalIntegrada')

            if CAJA_INTEGRADA:
                query_main += f" AND TS.IN_ESTADOCAJA_INTEGRADA IN ({CAJA_INTEGRADA})"
            if terminal_integrada:
                query_main += f" AND TS.IN_ESTADOCAJA_INTEGRADA IN ({terminal_integrada})"
            if sucursal_input:
                query_main += f" AND S.ST_DESC_SUCURSAL LIKE '%{sucursal_input}%'"
                query_dropdown_caja += f" AND S.ST_DESC_SUCURSAL LIKE '%{sucursal_input}%'"
            if caja_input:
                query_main += f" AND C.ST_DESC_CAJASUCURSAL LIKE '%{caja_input}%'"
            if terminal_input:
                query_main += f" AND CONVERT(VARCHAR(50), TS.IN_COD_TERMINALSUCURSALES) LIKE '%{terminal_input}%'"
            if terminal_id_input:
                query_main += f" AND TS.ST_COD_TERMINAL LIKE '%{terminal_id_input}%'"
            if terminal_serial_input:
                query_main += f" AND TS.ST_SERIAL_TERMINAL LIKE '%{terminal_serial_input}%'"

            query_main+= f'''ORDER BY 
		CASE WHEN TS.IN_ESTADOCAJA_INTEGRADA = 1 AND  TS.IN_ESTADOTERMINAL_ACTIVA =1 AND TS.IN_ESTADOCAJA_INTEGRADA=1 THEN 1 ELSE 0 END DESC,		
		ESTADO_TERMINAL DESC, TERMINAL_INTEGRADO DESC,CAJA_INTEGRADA DESC, CAJA'''

        with pyodbc.connect(connection_string) as connection:
            df_main = pd.read_sql(query_main, connection)
            df_dropdown_sucursal = pd.read_sql(query_dropdown_sucursal, connection)
            df_dropdown_caja = pd.read_sql(query_dropdown_caja, connection)

        table_data = []
        for _, row in df_main.iterrows():
            table_data.append({
                "ID": row["ID"],
                "SERIAL": row["SERIAL"],
                "SUCURSAL": row["SUCURSAL"],
                "CAJA": row["CAJA"],
                "ESTADO_TERMINAL": 'btn-green' if row["ESTADO_TERMINAL"] == 1 else 'btn-red',
                "TERMINAL_INTEGRADO": 'btn-green' if row["TERMINAL_INTEGRADO"] == 1 else 'btn-red',
                "CAJA_INTEGRADA": 'btn-green' if row["CAJA_INTEGRADA"] == 1 else 'btn-red',
                "ID_TERMINAL_GETNET": row["ID_TERMINAL_GETNET"],
                "ID_SUCURSAL_GETNET": row["ID_SUCURSAL_GETNET"]
            })

        sucursales = df_dropdown_sucursal["ST_DESC_SUCURSAL"].tolist()
        cajas = df_dropdown_caja["ST_DESC_CAJASUCURSAL"].tolist()
        
        
        query_activos = '''
        SELECT COUNT(IN_ESTADOTERMINAL_ACTIVA)
        FROM QA_Adyacente.DBO.T_GETNET_TERMINALSUCURSALES 
        WHERE IN_ESTADOTERMINAL_ACTIVA = 1
        '''
        with pyodbc.connect(connection_string) as connection:
            df_activo = pd.read_sql(query_activos, connection)

        terminales_activos = df_activo.iloc[0, 0]
        


        query_cajas_integradas = '''
        SELECT COUNT(IN_ESTADOCAJA_INTEGRADA)
        FROM QA_Adyacente.DBO.T_GETNET_TERMINALSUCURSALES 
        WHERE IN_ESTADOCAJA_INTEGRADA = 1
        '''
        with pyodbc.connect(connection_string) as connection:
            df_cajas_integada = pd.read_sql(query_cajas_integradas, connection)

        cajas_integradas = df_cajas_integada.iloc[0, 0]

        return render_template('index.html', table_data=table_data, sucursales=sucursales, cajas=cajas, terminales_activos=terminales_activos, cajas_integradas=cajas_integradas)

    except pyodbc.Error as e:
        return f"Error al conectar a la base de datos: {e}"
    except pd.io.sql.DatabaseError as e:
        return f"Error al ejecutar la consulta SQL: {e}"
    except Exception as e:
        return f"Ocurrió un error inesperado: {e}"

    
@app.route('/insertar', methods=['GET', 'POST'])
def insertar():
    try:
        form_data = request.form
        serial = form_data.get('serial')
        id_terminal_getnet = form_data.get('id_terminal_getnet')
        id_sucursal_getnet = form_data.get('id_sucursal_getnet')
        sucursal = form_data.get('sucursal')
        caja = form_data.get('caja')

        with pyodbc.connect(connection_string) as connection:
            cursor = connection.cursor()

            sucursal_query = """
            SELECT IN_COD_SUCURSAL 
            FROM homologacionpalumbo.DBO.T_GEN_SUCURSAL
            WHERE ST_DESC_SUCURSAL LIKE ?
            """
            cursor.execute(sucursal_query, sucursal)
            sucursal_row = cursor.fetchone()

            if not sucursal_row:
                return jsonify({"status": "error", "message": "Sucursal no encontrada."})

            sucursal_code = sucursal_row[0]

            caja_query = """
            SELECT IN_COD_CAJASUCURSAL
            FROM homologacionpalumbo.DBO.T_POS_CAJASUCURSAL
            WHERE ST_DESC_CAJASUCURSAL LIKE ?
            """
            cursor.execute(caja_query, caja)
            caja_row = cursor.fetchone()

            if not caja_row:
                return jsonify({"status": "error", "message": "Caja no encontrada."})

            caja_code = caja_row[0]

            insert_query = """
            INSERT INTO QA_Adyacente.DBO.T_GETNET_TERMINALSUCURSALES
            (
                ST_SERIAL_TERMINAL, 
                ST_COD_TERMINAL, 
                ST_COD_SUCURSALASIGNACIONTERMINAL, 
                IN_COD_SUCURSAL, 
                IN_COD_CAJASUCURSAL, 
                IN_ESTADOTERMINAL_ACTIVA, 
                DT_FECHACREACIONREGISTRO,
				IN_ESTADOCAJA_INTEGRADA
            ) 
            VALUES (?, ?, ?, ?, ?, 0, GETDATE(),0)
            """
                
            cursor.execute(insert_query, serial, id_terminal_getnet, id_sucursal_getnet, sucursal_code, caja_code)
            connection.commit()
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})
    return redirect(url_for('index'))
   
    
    
@app.route('/insert', methods=['GET', 'POST'])
def insert():
    try:
        query_dropdown_sucursal = """
        SELECT ST_DESC_SUCURSAL
        FROM homologacionpalumbo.DBO.T_GEN_SUCURSAL S
        LEFT JOIN T_GETNET_TERMINALSUCURSALES TS 
        ON TS.IN_COD_SUCURSAL = S.IN_COD_SUCURSAL
        WHERE ST_DESC_SUCURSAL NOT LIKE '%(CERRADO)%'
        AND CONVERT(INT,ST_CODIGO_SUCURSAL) > 300
        AND CONVERT(INT,ST_CODIGO_SUCURSAL) < 500
        """

        query_dropdown_caja = """
        SELECT C.ST_DESC_CAJASUCURSAL 
		FROM homologacionpalumbo.DBO.T_GEN_SUCURSAL S
		JOIN homologacionpalumbo.DBO.T_POS_CAJASUCURSAL C
		ON C.IN_COD_SUCURSAL = S.IN_COD_SUCURSAL
        """

        params_sucursal = []
        params_caja = []
        if request.method == 'POST':
            sucursal_input = request.form.get('sucursal')
            caja_input = request.form.get('caja')
            
            if sucursal_input:
                query_dropdown_sucursal += " AND ST_DESC_SUCURSAL LIKE ?"
                query_dropdown_caja += " AND S.ST_DESC_SUCURSAL LIKE ?"
                params_sucursal.append(f"%{sucursal_input}%")
                params_caja.append(f"%{sucursal_input}%")
            
            if caja_input:
                query_dropdown_caja += " AND C.ST_DESC_CAJASUCURSAL LIKE ?"
                params_caja.append(f"%{caja_input}%")
        
        with pyodbc.connect(connection_string) as connection:
            df_dropdown_sucursal = pd.read_sql(query_dropdown_sucursal, connection, params=params_sucursal)
            df_dropdown_caja = pd.read_sql(query_dropdown_caja, connection, params=params_caja)
            
        
        sucursales = df_dropdown_sucursal["ST_DESC_SUCURSAL"].tolist()
        cajas = df_dropdown_caja["ST_DESC_CAJASUCURSAL"].tolist()
        
        return render_template('insert.html', sucursales=sucursales,cajas=cajas)
    except pyodbc.Error as e:
        return f"Error al conectar a la base de datos: {e}"
    except pd.io.sql.DatabaseError as e:
        return f"Error al ejecutar la consulta SQL: {e}"
    except Exception as e:
        return f"Ocurrió un error inesperado: {e}"


@app.route('/update', methods=['GET', 'POST'])
def update():
    try:
        query_dropdown_sucursal = """
        SELECT DISTINCT ST_DESC_SUCURSAL
        FROM homologacionpalumbo.DBO.T_GEN_SUCURSAL S
        LEFT JOIN T_GETNET_TERMINALSUCURSALES TS 
        ON TS.IN_COD_SUCURSAL = S.IN_COD_SUCURSAL
        WHERE ST_DESC_SUCURSAL NOT LIKE '%(CERRADO)%'
        AND CONVERT(INT,ST_CODIGO_SUCURSAL) > 300
        AND CONVERT(INT,ST_CODIGO_SUCURSAL) < 500
        """

        query_dropdown_caja = """
        SELECT DISTINCT C.ST_DESC_CAJASUCURSAL 
		FROM homologacionpalumbo.DBO.T_GEN_SUCURSAL S
		JOIN homologacionpalumbo.DBO.T_POS_CAJASUCURSAL C
		ON C.IN_COD_SUCURSAL = S.IN_COD_SUCURSAL
        """
        id = request.args.get('id')
        serial = request.args.get('serial')
        sucursal = request.args.get('sucursal')
        sucursal_input = request.args.get('sucursal')
        caja = request.args.get('caja')
        caja_input = request.args.get('caja')
        id_terminal_getnet = request.args.get('id_terminal_getnet')
        id_sucursal_getnet = request.args.get('id_sucursal_getnet')

        params_sucursal = []
        params_caja = []
        if request.method == 'POST':
            sucursal_input = request.form.get('sucursal')
            caja_input = request.form.get('caja')
            
            if sucursal_input:
                query_dropdown_sucursal += " AND ST_DESC_SUCURSAL LIKE ?"
                query_dropdown_caja += " AND S.ST_DESC_SUCURSAL LIKE ?"
                params_sucursal.append(f"%{sucursal_input}%")
                params_caja.append(f"%{sucursal_input}%")
            
            if caja_input:
                query_dropdown_caja += " AND C.ST_DESC_CAJASUCURSAL LIKE ?"
                params_caja.append(f"%{caja_input}%")
        
        with pyodbc.connect(connection_string) as connection:
            df_dropdown_sucursal = pd.read_sql(query_dropdown_sucursal, connection, params=params_sucursal)
            df_dropdown_caja = pd.read_sql(query_dropdown_caja, connection, params=params_caja)
            
        
        sucursales = df_dropdown_sucursal["ST_DESC_SUCURSAL"].tolist()
        cajas = df_dropdown_caja["ST_DESC_CAJASUCURSAL"].tolist()
        
        return render_template('update.html', id=id, serial=serial,sucursal=sucursal,sucursales=sucursales,caja=caja,cajas=cajas, id_terminal_getnet=id_terminal_getnet, id_sucursal_getnet=id_sucursal_getnet)
    except pyodbc.Error as e:
        return f"Error al conectar a la base de datos: {e}"
    except pd.io.sql.DatabaseError as e:
        return f"Error al ejecutar la consulta SQL: {e}"
    except Exception as e:
        return f"Ocurrió un error inesperado: {e}"
    
@app.route('/guardar', methods=['POST'])
def guardar():
    try:
        form_data = request.form
        id_ = int(form_data.get('id'))
        serial = form_data.get('serial')
        id_terminal_getnet = form_data.get('id_terminal_getnet')
        id_sucursal_getnet = form_data.get('id_sucursal_getnet')
        sucursal = form_data.get('sucursal')
        caja = form_data.get('caja')

        with pyodbc.connect(connection_string) as connection:
            cursor = connection.cursor()

            sucursal_query = """
            SELECT IN_COD_SUCURSAL 
            FROM homologacionpalumbo.DBO.T_GEN_SUCURSAL
            WHERE ST_DESC_SUCURSAL LIKE ?
            """
            cursor.execute(sucursal_query, sucursal)
            sucursal_row = cursor.fetchone()

            if not sucursal_row:
                return jsonify({"status": "error", "message": "Sucursal no encontrada."})

            sucursal_code = sucursal_row[0]

            caja_query = """
            SELECT IN_COD_CAJASUCURSAL
            FROM homologacionpalumbo.DBO.T_POS_CAJASUCURSAL
            WHERE ST_DESC_CAJASUCURSAL LIKE ?
            """
            cursor.execute(caja_query, caja)
            caja_row = cursor.fetchone()

            if not caja_row:
                return jsonify({"status": "error", "message": "Caja no encontrada."})

            caja_code = caja_row[0]

            id_query = "SELECT IN_COD_TERMINALSUCURSALES FROM QA_Adyacente.DBO.T_GETNET_TERMINALSUCURSALES"
            cursor.execute(id_query)
            existing_ids = {row[0] for row in cursor.fetchall()}
            

            if id_ in existing_ids:
                update_query = """
                UPDATE QA_Adyacente.DBO.T_GETNET_TERMINALSUCURSALES
                SET 
                    ST_SERIAL_TERMINAL = ?, 
                    ST_COD_TERMINAL = ?, 
                    ST_COD_SUCURSALASIGNACIONTERMINAL = ?, 
                    IN_COD_SUCURSAL = ?, 
                    IN_COD_CAJASUCURSAL = ?
                WHERE IN_COD_TERMINALSUCURSALES = ?
                """
                try:
                    cursor.execute(update_query, serial, id_terminal_getnet, id_sucursal_getnet, sucursal_code, caja_code, id_)
                    connection.commit()
                except Exception as e:
                    return jsonify({"status": "error", "message": str(e)})
                return redirect(url_for('index'))
            else:
                return jsonify({"status": "success", "message": "Datos no encontrados."})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


@app.route('/eliminar', methods=['POST'])
def eliminar():
    id = request.form.get('id')
    try:
        with pyodbc.connect(connection_string) as connection:
            cursor = connection.cursor()
            cursor.execute("DELETE FROM [dbo].[T_GETNET_TERMINALSUCURSALES] WHERE [IN_COD_TERMINALSUCURSALES] = ?", id)
        return redirect(url_for('index'))
    except pyodbc.Error as e:
        return f"Error al conectar a la base de datos: {e}"
    except Exception as e:
        return f"Ocurrió un error inesperado: {e}"

@app.route('/actualizar_cajas', methods=['POST'])
def actualizar_cajas():
    try:
        data = request.get_json()
        sucursal_input = data.get('sucursal')

        query_dropdown_caja = """
        SELECT DISTINCT C.ST_DESC_CAJASUCURSAL 
        FROM homologacionpalumbo.DBO.T_GEN_SUCURSAL S
        JOIN homologacionpalumbo.DBO.T_POS_CAJASUCURSAL C
        ON C.IN_COD_SUCURSAL = S.IN_COD_SUCURSAL
        WHERE S.ST_DESC_SUCURSAL LIKE ?
        """
        
        params_caja = [f"%{sucursal_input}%"]
        
        with pyodbc.connect(connection_string) as connection:
            df_dropdown_caja = pd.read_sql(query_dropdown_caja, connection, params=params_caja)
        
        cajas = df_dropdown_caja["ST_DESC_CAJASUCURSAL"].tolist()

        return jsonify({"cajas": cajas})
    except pyodbc.Error as e:
        return jsonify({"status": "error", "message": f"Error al conectar a la base de datos: {e}"})
    except pd.io.sql.DatabaseError as e:
        return jsonify({"status": "error", "message": f"Error al ejecutar la consulta SQL: {e}"})
    except Exception as e:
        return jsonify({"status": "error", "message": f"Ocurrió un error inesperado: {e}"})


@app.route('/update_estado_terminal/<int:id_terminal>', methods=['POST'])
def update_estado_terminal(id_terminal):
    try:
        with pyodbc.connect(connection_string) as connection:
            cursor = connection.cursor()

            query = 'SELECT IN_ESTADOTERMINAL_ACTIVA FROM T_GETNET_TERMINALSUCURSALES WHERE IN_COD_TERMINALSUCURSALES = ?'
            cursor.execute(query, (id_terminal,))
            current_state = cursor.fetchone()[0]

            new_state = 1 if current_state == 0 else 0

            update_query = 'UPDATE T_GETNET_TERMINALSUCURSALES SET IN_ESTADOTERMINAL_ACTIVA = ? WHERE IN_COD_TERMINALSUCURSALES = ?'
            cursor.execute(update_query, (new_state, id_terminal))
            connection.commit()

        return jsonify({'success': True, 'new_state': new_state})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    

@app.route('/update_caja_integrada/<int:id_terminal>', methods=['POST'])
def update_caja_integrada(id_terminal):
    try:
        with pyodbc.connect(connection_string) as connection:
            cursor = connection.cursor()

            query = 'SELECT IN_ESTADOCAJA_INTEGRADA FROM T_GETNET_TERMINALSUCURSALES WHERE IN_COD_TERMINALSUCURSALES = ?'
            cursor.execute(query, (id_terminal,))
            current_state = cursor.fetchone()[0]

            new_state = 1 if current_state == 0 else 0

            update_query = 'UPDATE T_GETNET_TERMINALSUCURSALES SET IN_ESTADOCAJA_INTEGRADA  = ? WHERE IN_COD_TERMINALSUCURSALES = ?'
            cursor.execute(update_query, (new_state, id_terminal))
            connection.commit()

        return jsonify({'success': True, 'new_state': new_state})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})



@app.route('/gestor', methods=['GET', 'POST'])
def buscar_razon():
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()

        query = "SELECT IN_COD_RAZON,ST_RAZON,IN_TIEMPO FROM T_GETNET_RAZONES_DESINTEGRACION"
        data = pd.read_sql(query, conn)
        
        
        table_data = data.to_dict(orient='records')
        

        return render_template('gestor.html', table_data=table_data)
    except Exception as e:
        return f"Error: {str(e)}"
    finally:
        cursor.close()
        conn.close()

@app.route('/gestionar/<int:razon_id>', methods=['GET', 'POST'])
def gestionar_razon(razon_id):
    try:

        conn = pyodbc.connect(connection_string)
        query = f"SELECT IN_COD_RAZON, ST_RAZON, IN_TIEMPO FROM T_GETNET_RAZONES_DESINTEGRACION WHERE IN_COD_RAZON = {razon_id}"
        razon = pd.read_sql(query, conn).to_dict(orient='records')[0]
        
        if request.method == 'POST':

            accion = request.form['accion']
            if accion == 'eliminar':
                delete_query = f"DELETE FROM T_GETNET_RAZONES_DESINTEGRACION WHERE IN_COD_RAZON = {razon_id}"
                conn.execute(delete_query)
                conn.commit()
                return redirect(url_for('buscar_razon'))
            elif accion == 'actualizar':
                nuevo_razon = request.form['nuevo_razon']
                nuevo_tiempo = request.form['nuevo_tiempo']
                
                update_query = f"""
                    UPDATE T_GETNET_RAZONES_DESINTEGRACION
                    SET ST_RAZON = ?, IN_TIEMPO = ?
                    WHERE IN_COD_RAZON = ?
                """
                conn.execute(update_query, (nuevo_razon, nuevo_tiempo, razon_id))
                conn.commit()
                return redirect(url_for('buscar_razon'))
        
        return render_template('gestionar.html', razon=razon)
    except Exception as e:
        return f"Error: {str(e)}"
    finally:
        conn.close()

@app.route('/agregar', methods=['POST'])
def agregar_razon():
    try:

        nuevo_razon = request.form['nuevo_razon']
        nuevo_tiempo = request.form['nuevo_tiempo']
        

        conn = pyodbc.connect(connection_string)
        insert_query = """
            INSERT INTO T_GETNET_RAZONES_DESINTEGRACION (ST_RAZON, IN_TIEMPO)
            VALUES (?, ?)
        """
        conn.execute(insert_query, (nuevo_razon, nuevo_tiempo))
        conn.commit()
        

        return redirect(url_for('buscar_razon'))
    except Exception as e:
        return f"Error: {str(e)}"
    finally:
        conn.close()





if __name__ == '__main__':
    app.run(debug=True,host="0.0.0.0",port=4000)
