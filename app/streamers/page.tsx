'use client'
import {
    Layout,
    Nav,
    Button,
    Tag,
    Typography,
    Popconfirm, 
    Notification,
    Card
} from '@douyinfe/semi-ui';
import {
    IconHelpCircle,
    IconPlusCircle,
    IconVideoListStroked,
    IconEdit2Stroked, IconDeleteStroked
} from '@douyinfe/semi-icons';
import { List, ButtonGroup } from '@douyinfe/semi-ui';
import React, { useState } from "react";
import useStreamers from '../lib/use-streamers';
import TemplateModal from '../ui/TemplateModal';
import {LiveStreamerEntity, put, requestDelete, sendRequest} from "../lib/api-streamer";
import useSWRMutation from "swr/mutation";

export default function Home() {
    const { Header, Content } = Layout;
    const {Text } = Typography;
    const { streamers, isLoading } = useStreamers();
    const {trigger: deleteStreamers} = useSWRMutation('/v1/streamers', requestDelete);
    const {trigger: updateStreamers} = useSWRMutation('/v1/streamers', put);
    const { trigger } = useSWRMutation('/v1/streamers', sendRequest)

    const onConfirm = async (id: number) => {
        await deleteStreamers(id);
    };
    const handleEntityPostprocessor = (values: any) => {
        if (values?.postprocessor) {
            values.postprocessor = values.postprocessor.map((element: { [key: string]: string } | string) => {
                if (element === "rm") {
                    return { cmd: "rm" };
                } else if (typeof element === "object" && !element.cmd) {
                    const [key, value] = Object.entries(element)[0];
                    return { cmd: key, value: value };
                }
                return element
            });
            // console.log(values.postprocessor);
        }
        return values;
    };
    const data: LiveStreamerEntity[] | undefined = streamers?.map((live) => {
        let status;
        switch (live.status) {
            case 'Working': status = <Tag color='red'>直播中</Tag>; break;
            case 'Idle': status = <Tag color='green'>空闲</Tag>; break;
            case 'Pending': status = <Tag color='grey'>未知</Tag>; break;
            case 'Inspecting': status = <Tag color='indigo'>检测中</Tag>; break;
        }
        return {...handleEntityPostprocessor(live), status};
    });

    const handleOk = async (values: any) => {
        if (values?.postprocessor) {
            values.postprocessor = values.postprocessor.map(
                ({ cmd, value }: { cmd: string; value: string; }) => (cmd === "rm" ? "rm" : {[cmd]: value})
            );
        }
        try {
            const res = await trigger(values);
        } catch (e: any) {
            Notification.error({
                title: '创建失败',
                content: <Typography.Paragraph style={{ maxWidth: 450 }}>{e.message}</Typography.Paragraph>,
                style: { width: 'min-content' }
            });
            throw e;
        }
    };

    const handleUpdate = async (values: any) => {
        // console.log(values);
        delete values.status;
        if (values?.postprocessor) {
            values.postprocessor = values.postprocessor.map(
                ({ cmd, value }: { cmd: string; value: string; }) => (cmd === "rm" ? "rm" : {[cmd]: value})
            );
        }
        try {
            const res = await updateStreamers(values);
        } catch (e: any) {
            Notification.error({
                title: '更新失败',
                content: <Typography.Paragraph style={{ maxWidth: 450 }}>{e.message}</Typography.Paragraph>,
                style: { width: 'min-content' }
            });
            throw e;
        }
    };
    return (<>
        <Header style={{
            backgroundColor: 'var(--semi-color-bg-1)', position: 'sticky', top: 0, zIndex: 1
        }}>
            <Nav
                header={<><div style={{
                    backgroundColor: 'rgba(var(--semi-green-4), 1)',
                    borderRadius: 'var(--semi-border-radius-large)',
                    color: 'var(--semi-color-bg-0)',
                    display: 'flex',
                    // justifyContent: 'center',
                    padding: '6px'
                }}><IconVideoListStroked size='large' /></div><h4 style={{ marginLeft: '12px' }}>录播管理</h4></>}
                mode="horizontal"
                footer={<>
                    <Button
                        theme="borderless"
                        icon={<IconHelpCircle size="large" />}
                        style={{
                            color: 'var(--semi-color-text-2)',
                            marginRight: '12px',
                        }} onClick={() => window.location.href = '/static/ds_update.log'} />
                    <TemplateModal onOk={handleOk}>
                        <Button icon={<IconPlusCircle />} theme="solid" style={{ marginRight: 10 }}>新建</Button>
                    </TemplateModal>
                </>}
            ></Nav>
        </Header>
        <Content
            style={{
                padding: '24px',
                backgroundColor: 'var(--semi-color-bg-0)',
            }}
        >
            <main>
                <List
                    grid={{
                        gutter: 12,
                        xs: 20,
                        sm: 18,
                        md: 12,
                        lg: 8,
                        xl: 6,
                        xxl: 4,
                    }}
                    dataSource={data}
                    renderItem={item => (
                        <List.Item>
                            <Card
                            shadows='hover'
                            style={{
                                maxWidth: 360,
                                margin: '8px 2px',
                                flexGrow: 1,
                            }}
                            bodyStyle={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ position: 'absolute', right: "10%", top: 9}}>{item.status}</div>
                                <div style={{ flexGrow: 1}}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <h3 style={{ color: 'var(--semi-color-text-0)', fontWeight: 500, maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.remark}</h3>
                                    </div>
                                    <Text ellipsis={{ showTooltip: { opts: { style: { wordBreak: 'break-all' } } } }} type="tertiary">{item.url}</Text>
                                    <div style={{ margin: '0', display: 'flex', padding: "0 0 32px 0px", justifyContent: 'flex-end' }}>
                                        <ButtonGroup theme='borderless' style={{ position: 'absolute', right: "10%", bottom: "15%"}}>
                                            <TemplateModal onOk={handleUpdate} entity={item}>
                                                <Button theme='borderless' icon={<IconEdit2Stroked />}></Button>
                                            </TemplateModal>
                                            <span className="semi-button-group-line semi-button-group-line-borderless semi-button-group-line-primary"></span>
                                            <Popconfirm
                                                title="确定是否要删除？"
                                                content="此操作将不可逆"
                                                onConfirm={async () => await onConfirm(item.id)}
                                                // onCancel={onCancel}
                                            >
                                                <Button theme='borderless' icon={<IconDeleteStroked />}></Button>
                                            </Popconfirm>
                                        </ButtonGroup>
                                    </div>
                                </div>
                            </Card>
                            
                        </List.Item>
                    )}
                />
            </main>
        </Content>
    </>);
}
