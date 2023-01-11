import axios from "axios";
import { useEffect, useState } from "react";
import { Table } from "antd";
import { v4 as uuidv4 } from "uuid";

const sheetId = "1OrP_Ud2W2SXYaMMJ6GwYQJ16_m588g8UPQklk6qCxUY";
const base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?`;
const sheetName = "user-data";
const query = encodeURIComponent("Select *");
const url = `${base}&sheet=${sheetName}&tq=${query}`;

function PriceTable(props) {
  const [columns, setColumns] = useState("");
  const [data, setData] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const getData = new Promise(function (resolve, reject) {
    axios
      .get(url)
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
          align: "center",
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
        });
        return object;
      })
    );
  }

  useEffect(() => {
    getData.then((result) => generateTable(result)).then(setIsLoading(false));
  }, []);

  return (
    <div className="PriceTable component">
      {
        <Table
          columns={columns}
          dataSource={data}
          loading={isLoading}
          sticky={columns.length <= 5 ? false : true}
          pagination={false}
          bordered
          size="middle"
        />
      }
    </div>
  );
}
export default PriceTable;
