import axios from "axios";
import { useEffect, useState } from "react";
import { Space, Table, Tooltip } from "antd";
import { v4 as uuidv4 } from "uuid";
import Showdown from "showdown";
const converter = new Showdown.Converter();
import { InfoCircleFilled } from "@ant-design/icons";
const spreadsheetId = "1OrP_Ud2W2SXYaMMJ6GwYQJ16_m588g8UPQklk6qCxUY";
const base = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?`;
const query = encodeURIComponent("Select *");
// const url = `${base}&sheet=${sheetName}&tq=${query}`;
////https://docs.google.com/spreadsheets/d/1zdF7StPiiW-jTKGHuIyKtFvjHUcwerMwHCyIrH_HD4c/gviz/tq?tqx=out:csv&gid=1820138425&tq=SELECT+A%2CC%2CD+where+B+contains+%27R%27

function PriceTable(props) {
  const [columns, setColumns] = useState("");
  const [data, setData] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const getData = new Promise(function (resolve, reject) {
    axios
      .get(`${base}&sheet=${props.sheetName}&tq=${query}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => reject(err));
  });
  function generateTable(rep) {
    const jsonData = JSON.parse(rep.substring(47).slice(0, -2)).table;
    setColumns(
      jsonData.cols.map((el) => {
        return {
          title: el.label,
          dataIndex: el.label.toLowerCase(),
          key: el.id,
          fixed: "left",
        };
      })
    );
    setData(
      jsonData.rows.map((row) => {
        let object = {};
        jsonData.cols.map((el, index) => {
          object = {
            ...object,
            [el.label.toLowerCase()]:
              row.c[index] != null ? row.c[index].v : null,
            key: uuidv4(),
          };
          // console.log(row.c[index]);
        });

        return object;
      })
      );
  }

  useEffect(() => {
    getData.then((result) => generateTable(result)).then(setIsLoading(false));
  }, []);

  return (
    <div className="PriceTable Component" id={props.anchor} href={'#' + props.anchor}>
      <div className="title">
        {!props.description ? (
          <div className="label-container">
            <div className="hr"></div>
            <div className="label-components">
              <h3 className="label">{props.sheetName}</h3>
            </div>
            <div className="hr"></div>
          </div>
        ) : (
          <div className="label-container">
            <div className="hr"></div>
            <div className="label-components">
              <h3 className="label">{props.sheetName}</h3>
            <Tooltip color={"#fa8072"} placement="topLeft" title={props.description} >
              <InfoCircleFilled style={{fontSize:"1.5em", margin:-10, padding:10}}></InfoCircleFilled>
            </Tooltip>
            </div>
            <div className="hr"></div>
          </div>
        )}
        {props.description && (
          <span className="description">{props.subtitie}</span>
        )}
      </div>
      <Table
        className="Table"
        columns={columns}
        dataSource={data}
        loading={isLoading}
        sticky={columns.length <= 5 ? false : true}
        pagination={false}
        bordered
        size="small"
      />
    </div>
  );
}
export default PriceTable;
