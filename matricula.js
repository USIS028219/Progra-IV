Vue.component('v-select-registro_alumnos', VueSelect.VueSelect);
Vue.component('component-matricula',{
    data:()=>{
        return {
            accion : 'nuevo',
            msg    : '',
            status : false,
            error  : false,
            buscar : "",
            matricula:{
                registro_alumno : {
                    id : 0,
                    label : ''
                },
                idMatricula : 0,
                codigo    : '',
                nombre    : '',
                ciclo : '',
                fecha : ''
            },
            matricula:[],
            registro_alumnos:[]
        }
    },
    methods:{
        buscandoMatricula(){
            this.matricula = this.matricula.filter((element,index,matricula) => element.nombre.toUpperCase().indexOf(this.buscar.toUpperCase())>=0 || element.codigo.toUpperCase().indexOf(this.buscar.toUpperCase())>=0 );
            if( this.buscar.length<=0){
                this.obtenerDatos();
            }
        },
        buscandoCodigoMatricula(store){
            let buscarCodigo = new Promise( (resolver,rechazar)=>{
                let index = store.index("codigo"),
                    data = index.get(this.matricula.codigo);
                data.onsuccess=evt=>{
                    resolver(data);
                };
                data.onerror=evt=>{
                    rechazar(data);
                };
            });
            return buscarCodigo;
        },
        async guardarMatricula(){
            /**
             * webSQL -> DB Relacional en el navegador
             * localStorage -> BD NOSQL clave/valor
             * indexedDB -> BD NOSQL clave/valor
             */
            let store = this.abrirStore("tblmatricula",'readwrite'),
                duplicado = false;
            if( this.accion=='nuevo' ){
                this.matricula.idMatricula = generarIdUnicoDesdeFecha();

                let data = await this.buscandoCodigoMatricula(store);
                duplicado = data.result!=undefined;
            }
            if( duplicado==false){
                let query = store.put(this.matricula);
                query.onsuccess=event=>{
                    this.obtenerDatos();
                    this.limpiar();

                    this.mostrarMsg('EL REGISTRO DE LA MATRICULA SE HA GUARDADO CON ÉXITO',false);
                };
                query.onerror=event=>{
                    this.mostrarMsg('HA HABIDO UN ERROR AL GUARDAR EL REGISTRO DE LA MATRICULA',true);
                    console.log( event );
                };
            } else{
                this.mostrarMsg('CÓDIGO DUPLICADO',true);
            }
        },
        mostrarMsg(msg, error){
            this.status = true;
            this.msg = msg;
            this.error = error;
            this.quitarMsg(3);
        },
        quitarMsg(time){
            setTimeout(()=>{
                this.status=false;
                this.msg = '';
                this.error = false;
            }, time*1000);
        },
        obtenerDatos(){
            let store = this.abrirStore('tblmatricula','readonly'),
                data = store.getAll();
            data.onsuccess=resp=>{
                this.matricula = data.result;
            };
            let storeRegistro_alumno = this.abrirStore('tblregistro', 'readonly'),
                dataRegistro_alumno = storeRegistro_alumno.getAll();
            this.registro_alumnos = [];
            dataRegistro_alumno.onsuccess=resp=>{
                dataRegistro_alumno.result.forEach(element => {
                    this.registro_alumnos.push({id:element.idRegistro, label:element.nombre});
                });
            };    
        },
        mostrarMatricula(matri){
            this.matricula = matri;
            this.accion='modificar';
        },
        limpiar(){
            this.accion='nuevo';
            this.matricula.registro_alumno.id=0;
            this.matricula.registro_alumno.label="";
            this.matricula.idMatricula='';
            this.matricula.codigo='';
            this.matricula.nombre='';
            this.matricula.ciclo='';
            this.matricula.fecha='';
            this.obtenerDatos();
        },
        eliminarMatricula(matri){
            if( confirm(`¿DESEA ELIMINAR ESTE REGISTRO?:  ${matri.nombre}`) ){
                let store = this.abrirStore("tblmatricula",'readwrite'),
                    req = store.delete(matri.idMatricula);
                req.onsuccess=resp=>{
                    this.mostrarMsg('SE HA ELIMINADO EL REGISTRO CON ÉXITO',true);
                    this.obtenerDatos();
                };
                req.onerror=resp=>{
                    this.mostrarMsg('ERROR AL INTENTAR ELIMINAR EL REGISTRO',true);
                    console.log( resp );
                };
            }
        },
        abrirStore(store,modo){
            let tx = db.transaction(store,modo);
            return tx.objectStore(store);
        }
    },
    created(){
        //this.obtenerDatos();
    },
    template:`
    <form v-on:submit.prevent="guardarMatricula" v-on:reset="limpiar">
        <div class="row">
            <div class="col-sm-5">
                <div class="row p-2">
                    <div class="col-sm text-center text-white bg-info">
                        <div class="row">
                            <div class="col-11">
                                <h5>Realizar Matricula</h5>
                            </div>
                            <div class="col-1 align-middle" >
                                <button type="button" onclick="appVue.forms['matricula'].mostrar=false" class="btn-close" aria-label="Close"></button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row p-2">
                        <div class="col-sm">Datos:</div>
                        <div class="col-sm">
                            <v-select-registro_alumnos v-model="matricula.registro_alumno" :options="registro_alumnos" placeholder="Seleccione"/>
                        </div>
                    </div>
                <div class="row p-2">
                    <div class="col-sm">Código:</div>
                    <div class="col-sm">
                        <input v-model="matricula.codigo" required pattern="^[A-Z]{4}[0-9]{6}$" type="text" class="form-control form-control-sm" >
                    </div>
                </div>
                <div class="row p-2">
                    <div class="col-sm">Nombre: </div>
                    <div class="col-sm">
                        <input v-model="matricula.nombre" type="text" class="form-control form-control-sm">
                    </div>
                </div>
                <div class="row p-2">
                    <div class="col-sm">Ciclo: </div>
                    <div class="col-sm">
                        <input v-model="matricula.ciclo" type="text" class="form-control form-control-sm">
                    </div>
                </div>
                <div class="row p-2">
                    <div class="col-sm">Fecha de la Matricula: </div>
                    <div class="col-sm">
                        <input v-model="matricula.fecha" type="date" class="form-control form-control-sm">
                    </div>
                </div>
                <div class="row p-2">
                    <div class="col-sm text-center">
                        <input type="submit" value="Guardar" class="btn btn-dark">
                        <input type="reset" value="Limpiar" class="btn btn-info">
                    </div>
                </div>
                <div class="row p-2">
                    <div class="col-sm text-center">
                        <div v-if="status" class="alert" v-bind:class="[error ? 'alert-danger' : 'alert-success']">
                            {{ msg }}
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-sm"></div>
            <div class="col-sm-6 p-2">
                <div class="row text-center text-white bg-dark">
                    <div class="col"><h5>Matriculas Realizadas</h5></div>
                </div>
                <div class="row">
                    <div class="col">
                        <table class="table table-sm table-hover">
                            <thead>
                                <tr>
                                    <td colspan="5">
                                        <input v-model="buscar" v-on:keyup="buscandoMatricula" type="text" class="form-control form-contro-sm" placeholder="Búsqueda">
                                    </td>
                                </tr>
                                <tr>
                                    <th>Código</th>
                                    <th>Nombre</th>
                                    <th>Ciclo</th>
                                    <th>Fecha de la Matricula</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="matri in matricula" v-on:click="mostrarMatricula(matri)">
                                    <td>{{ matri.codigo }}</td>
                                    <td>{{ matri.nombre }}</td>
                                    <td>{{ matri.ciclo }}</td>
                                    <td>{{ matri.fecha }}</td>
                                    <td>{{ matri.registro_alumno.label }}</td>
                                    <td>
                                        <a @click.stop="eliminarMatricula(matri)" class="btn btn-danger">DEL</a>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </form>
`
});