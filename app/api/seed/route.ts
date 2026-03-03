import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  try {
    // Limpiar tablas
    await sql`TRUNCATE asignaciones, ausencias, servicios, colaboradores, calendar RESTART IDENTITY CASCADE`;

    // Calendar
    await sql`INSERT INTO calendar (mes, label, dias_laborales, feriados, dif20) VALUES
      ('2025-01','Ene 2025',22,1,3),('2025-02','Feb 2025',20,0,0),('2025-03','Mar 2025',21,0,1),
      ('2025-04','Abr 2025',19,3,2),('2025-05','May 2025',21,1,2),('2025-06','Jun 2025',21,0,1),
      ('2025-07','Jul 2025',22,1,3),('2025-08','Ago 2025',19,2,1),('2025-09','Sep 2025',20,2,2),
      ('2025-10','Oct 2025',23,0,3),('2025-11','Nov 2025',18,2,0),('2025-12','Dic 2025',21,2,3),
      ('2026-01','Ene 2026',21,1,2),('2026-02','Feb 2026',20,0,0),('2026-03','Mar 2026',22,0,2),
      ('2026-04','Abr 2026',19,3,2),('2026-05','May 2026',20,1,1),('2026-06','Jun 2026',22,0,2)
    `;

    // Colaboradores
    await sql`INSERT INTO colaboradores (name, status, rol_principal, tribu, email, horas_dia) VALUES
      ('Abraham Arguello','Activo','Funcional','Dunamis','aarguello@xumtech.com',8),
      ('Ali Hashemi','Activo','Técnico','Bulwak','ahashemi@xumtech.com',8),
      ('Andrea Alpizar','Activo','PO','Dunamis','aalpizar@xumtech.com',8),
      ('Ángel Silva','Activo','Proveedores','Dunamis','asilva@xumtech.com',8),
      ('Carlos Quesada','Activo','Arquitecto','Yarigai','cquesada@xumtech.com',8),
      ('Carlos Roman','Activo','Técnico','Yarigai','croman@xumtech.com',8),
      ('Daniel Jacamo','Activo','Funcional','Dunamis','djacamo@xumtech.com',8),
      ('Deam Saavedra','Activo','Técnico','Yarigai','dsaavedra@xumtech.com',8),
      ('Edgar Mendoza','Activo','Arquitecto','Yarigai','emendoza@xumtech.com',8),
      ('Eduardo Solano','Activo','PO','Dunamis','esolano@xumtech.com',8),
      ('Geovanela Bermudez','Activo','Técnico','Yarigai','gbermudez@xumtech.com',8),
      ('Gerson Godinez','Activo','Funcional','Bulwak','ggodinez@xumtech.com',8),
      ('Gloriana Hernández','Activo','Funcional','Dunamis','ghernandez@xumtech.com',8),
      ('Hugo Brenes','Activo','Arquitecto','Yarigai','hbrenes@xumtech.com',8),
      ('Jose Lobo','Activo','PO','Yarigai','jlobo@xumtech.com',8),
      ('Jose Ramirez','Activo','Técnico','Yarigai','jramirez@xumtech.com',8),
      ('Juan José Villalobos','Activo','Técnico','Bulwak','jvillalobos@xumtech.com',8),
      ('Kendal Quesada','Activo','Técnico','Yarigai','kquesada@xumtech.com',8),
      ('Leonardo Fallas','Activo','Técnico','Bulwak','lfallas@xumtech.com',8),
      ('Luis Escobar','Activo','Técnico','Yarigai','lescobar@xumtech.com',8),
      ('Maribel Cordero','Activo','Funcional','Yarigai','mcordero@xumtech.com',8),
      ('Ronaldo Picado','Activo','Técnico','Bulwak','rpicado@xumtech.com',8),
      ('Ruben Barrantes','Activo','Técnico','Yarigai','rbarrantes@xumtech.com',8),
      ('Selenia Orozco','Activo','PO','Dunamis','sorozco@xumtech.com',8),
      ('Solange Meza','Activo','Técnico','Yarigai','smeza@xumtech.com',8),
      ('Victor Naranjo','Activo','Técnico','Bulwak','vnaranjo@xumtech.com',8),
      ('Wilson Garzón','Activo','Funcional','Bulwak','wgarzon@xumtech.com',8),
      ('Zimri Zamora','Activo','Arquitecto','Dunamis','zzamora@xumtech.com',8),
      ('Alex Alfaro','Inactivo','PO','Dunamis','aalfaro@xumtech.com',8),
      ('Alonso Blanco','Inactivo','Técnico','Dunamis','ablanco@xumtech.com',8)
    `;

    // Servicios
    await sql`INSERT INTO servicios (nombre, tipo, tribu, po, contrato_id, jira_id, tecnologia, horas_limite, estado, fecha_inicio, fecha_vencimiento, renovable) VALUES
      ('Coopenae','Soporte Evolutivo','Dunamis','Andrea Alpizar','CN-00180','NAE RL','Oracle CRM',20,'Activo','2024-01-01','2026-06-30',true),
      ('Coocique CRM','Soporte Evolutivo','Dunamis','Selenia Orozco','CN-00181','COOC','Oracle CRM',70,'Activo','2024-03-01','2026-08-31',true),
      ('Cable Bahamas Field Service','Soporte Evolutivo + Crítico','Dunamis','Eduardo Solano','CN-00182','CBLS','Salesforce Field Service',50,'Activo','2025-01-01','2026-04-30',true),
      ('Promerica RD','Soporte Evolutivo + Crítico','Dunamis','Andrea Alpizar','CN-00138','PRDSE','Oracle CRM',20,'Activo','2023-06-01','2026-05-31',true),
      ('Banrural CRM','Soporte Evolutivo + Crítico','Dunamis','Gloriana Hernández','CN-00102','BSE','Oracle CRM',82,'Activo','2023-01-01','2026-12-31',true),
      ('Prome BPM CR','Talento Dedicado','Dunamis','Selenia Orozco','CN-00189','','Salesforce CRM',160,'Activo','2025-07-01','2026-06-30',false),
      ('Purdy Salesforce','Talento Dedicado','Dunamis','Eduardo Solano','CN-00159','','Salesforce CRM',160,'Activo','2025-04-01','2026-03-31',true),
      ('Improsa Servicio Evolutivo','Soporte Evolutivo','Yarigai','Jose Lobo','CN-00203','IMPSE','Salesforce CRM',70,'Activo','2025-09-01','2026-08-31',true),
      ('Coopealianza','Soporte Evolutivo','Bulwak','Solange Meza','CN-00144','','Oracle CRM',30,'Activo','2024-06-01','2026-05-31',true),
      ('BCCR Migración Adobe','Proyecto','Dunamis','Hugo Brenes','CN-00200','','Adobe',800,'Activo','2026-01-15','2026-07-15',false)
    `;

    // Ausencias
    await sql`INSERT INTO ausencias (colaborador, mes, fecha, dias, tipo, notas) VALUES
      ('Ruben Barrantes','2026-01','2026-01-15',1,'Vacaciones',''),
      ('Carlos Roman','2026-02','2026-02-10',2,'Incapacidad','Gripe'),
      ('Andrea Alpizar','2025-12','2025-12-26',3,'Vacaciones','Fin de año')
    `;

    // Asignaciones
    await sql`INSERT INTO asignaciones (tribu, rol, colaborador, servicio_id, mes, horas) VALUES
      ('Dunamis','Técnico',null,1,'2026-02',20),
      ('Dunamis','Técnico',null,2,'2026-02',50),
      ('Dunamis','Técnico',null,3,'2026-02',40),
      ('Dunamis','Funcional',null,5,'2026-02',60),
      ('Dunamis','PO',null,1,'2026-02',10),
      ('Dunamis','PO',null,2,'2026-02',15),
      ('Dunamis','Técnico',null,10,'2026-02',80),
      ('Dunamis','Técnico',null,1,'2026-03',20),
      ('Dunamis','Técnico',null,2,'2026-03',50),
      ('Dunamis','Funcional',null,5,'2026-03',60),
      ('Bulwak','Técnico',null,9,'2026-02',30),
      ('Bulwak','Técnico',null,9,'2026-03',30),
      ('Yarigai','Técnico','Carlos Roman',8,'2026-02',60),
      ('Yarigai','Técnico','Deam Saavedra',8,'2026-02',40),
      ('Yarigai','PO','Jose Lobo',8,'2026-02',20),
      ('Yarigai','Técnico','Ruben Barrantes',10,'2026-02',70),
      ('Yarigai','Técnico','Carlos Roman',8,'2026-03',60),
      ('Yarigai','Técnico','Deam Saavedra',8,'2026-03',40),
      ('Yarigai','Técnico','Ruben Barrantes',10,'2026-03',70)
    `;

    return NextResponse.json({ ok: true, message: "Seed cargado correctamente" });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}